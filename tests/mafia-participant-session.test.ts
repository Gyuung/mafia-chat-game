import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { createParticipantSessions, type ParticipantSession, type ParticipantSessionStore } from "../src/server/auth/participant-session";

const origin = "https://mafia.example";
function fixture() {
  const rows = new Map<string, ParticipantSession>();
  let time = 100000;
  let finds = 0;
  const store: ParticipantSessionStore = {
    async insert(key, value) { assert.equal(rows.has(key), false); rows.set(key, value); },
    async find(key) { finds++; return rows.get(key) ?? null; },
    async delete(key) { rows.delete(key); },
  };
  const sessions = createParticipantSessions({ origin, store, ttlSeconds: 60, now: () => time });
  return { sessions, rows, store, setTime(value: number) { time = value; }, finds: () => finds };
}
function request(cookie?: string, url = origin) {
  return new Request(`${url}/api/dialogue`, { headers: cookie === undefined ? {} : { cookie } });
}
function cookie(header: string) { return header.split(";")[0]; }

test("세션 발급은 무작위 토큰의 해시만 저장하고 보안 쿠키를 반환", async () => {
  const f = fixture();
  const header = await f.sessions.issue("me");
  assert.match(header, /^__Host-mafia-session=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Strict; Secure; Max-Age=60$/u);
  const token = cookie(header).split("=")[1];
  const key = createHash("sha256").update(token).digest("hex");
  assert.deepEqual(f.rows.get(key), { playerId: "me", issuedAt: 100000, expiresAt: 160000 });
  assert.ok(!JSON.stringify([...f.rows]).includes(token));
  assert.deepEqual(await f.sessions.authenticate(request(cookie(header))), { playerId: "me" });
  assert.notEqual(await f.sessions.issue("me"), header);
});

test("누락·중복·변형·과대 쿠키와 다른 출처는 저장소 조회 전 거절", async () => {
  const f = fixture();
  const value = cookie(await f.sessions.issue("me"));
  const token = value.split("=")[1];
  for (const bad of [undefined, "", "playerId=me", `${value}; ${value}`, `${value}=`, `${value}%20`,
    `${f.sessions.cookieName}=${token.slice(0, -1)}!`, `${value}; padding=${"x".repeat(8192)}`]) {
    assert.equal(await f.sessions.authenticate(request(bad)), null);
  }
  assert.equal(await f.sessions.authenticate(request(value, "https://other.example")), null);
  assert.equal(f.finds(), 0);
});

test("서버에 없는 토큰과 토큰 한 글자 변조는 인증 불가", async () => {
  const f = fixture();
  const value = cookie(await f.sessions.issue("me"));
  const [name, token] = value.split("=");
  const changed = `${name}=${token[0] === "A" ? "B" : "A"}${token.slice(1)}`;
  assert.equal(await f.sessions.authenticate(request(changed)), null);
  assert.deepEqual(await f.sessions.authenticate(request(`other=ignored; ${value}; another=ok`)), { playerId: "me" });
});

test("정확한 만료 시점부터 인증을 거절하고 조회 중 지난 만료도 검사", async () => {
  const f = fixture();
  const value = cookie(await f.sessions.issue("me"));
  f.setTime(159999);
  assert.deepEqual(await f.sessions.authenticate(request(value)), { playerId: "me" });
  f.setTime(160000);
  assert.equal(await f.sessions.authenticate(request(value)), null);
  f.setTime(100000);
  const find = f.store.find;
  f.store.find = async (key) => { f.setTime(160000); return find(key); };
  assert.equal(await f.sessions.authenticate(request(value)), null);
});

test("폐기는 서버 기록을 삭제하고 동일 토큰 재사용을 차단", async () => {
  const f = fixture();
  const value = cookie(await f.sessions.issue("me"));
  const clear = await f.sessions.revoke(request(value));
  assert.match(clear, /^__Host-mafia-session=; Path=\/; HttpOnly; SameSite=Strict; Secure; Max-Age=0$/u);
  assert.equal(f.rows.size, 0);
  assert.equal(await f.sessions.authenticate(request(value)), null);
  assert.equal(await f.sessions.revoke(request()), clear);
});

test("손상된 저장소 기록·미래 발급·설정 초과 수명은 거절", async () => {
  const f = fixture();
  const value = cookie(await f.sessions.issue("me"));
  const key = [...f.rows.keys()][0];
  const good = f.rows.get(key)!;
  for (const bad of [{ playerId: "" }, { playerId: "me\n" }, { issuedAt: 100001 }, { issuedAt: -1 },
    { expiresAt: NaN }, { expiresAt: 160001 }, { expiresAt: 100000 }]) {
    f.rows.set(key, { ...good, ...bad });
    assert.equal(await f.sessions.authenticate(request(value)), null);
  }
});

test("저장소 장애에서는 쿠키를 발급하거나 인증·폐기 성공을 가장하지 않음", async () => {
  const f = fixture();
  const value = cookie(await f.sessions.issue("me"));
  f.store.insert = async () => { throw new Error("offline"); };
  f.store.find = async () => { throw new Error("offline"); };
  f.store.delete = async () => { throw new Error("offline"); };
  await assert.rejects(f.sessions.issue("me"), /offline/u);
  await assert.rejects(f.sessions.authenticate(request(value)), /offline/u);
  await assert.rejects(f.sessions.revoke(request(value)), /offline/u);
});

test("설정·참가자 ID·시각을 검사하고 HTTP는 localhost에서만 허용", async () => {
  const f = fixture();
  for (const bad of ["http://mafia.example", `${origin}/`, "ftp://mafia.example", "https://user:pass@mafia.example"]) {
    assert.throws(() => createParticipantSessions({ origin: bad, store: f.store }));
  }
  for (const ttlSeconds of [0, -1, 1.1, NaN, 86401]) {
    assert.throws(() => createParticipantSessions({ origin, store: f.store, ttlSeconds }));
  }
  for (const id of ["", " me", "me\n", "x".repeat(129)]) await assert.rejects(f.sessions.issue(id));
  f.setTime(NaN);
  await assert.rejects(f.sessions.issue("me"));
  const local = createParticipantSessions({ origin: "http://localhost:3000", store: f.store });
  const header = await local.issue("me");
  assert.match(header, /^mafia-local-session=/u);
  assert.ok(!header.includes("Secure"));
  assert.equal(await local.authenticate(request(cookie(header))), null);
  assert.deepEqual(await local.authenticate(request(cookie(header), "http://localhost:3000")), { playerId: "me" });
});
