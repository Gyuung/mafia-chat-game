import assert from "node:assert/strict";
import test from "node:test";
import { createPostgresSessionStore, type SessionQuery } from "../src/server/auth/postgres-session-store";
import { createParticipantSessions } from "../src/server/auth/participant-session";
import { createLogoutHandler } from "../src/server/auth/logout-handler";

const hash = "a".repeat(64);
const session = { playerId: "me", issuedAt: 1000, expiresAt: 2000 };

test("저장 값은 SQL 문자열에 합치지 않고 별도 매개변수로 전달", async () => {
  const calls: { sql: string; values: (string | number)[] }[] = [];
  const store = createPostgresSessionStore(async (sql, values) => { calls.push({ sql, values }); return { rows: [] }; });
  const playerId = "'; DROP TABLE sessions; --";
  await store.insert(hash, { ...session, playerId });
  assert.ok(calls[0].sql.includes("VALUES ($1, $2, $3, $4)"));
  assert.ok(!calls[0].sql.includes(playerId));
  assert.ok(!calls[0].sql.includes("ON CONFLICT"));
  assert.deepEqual(calls[0].values, [hash, playerId, 1000, 2000]);
  assert.equal(await store.find(hash), null);
  await store.delete(hash);
  assert.match(calls[1].sql, /WHERE token_hash = \$1$/u);
  assert.match(calls[2].sql, /^DELETE FROM public.mafia_participant_sessions WHERE token_hash = \$1$/u);
  assert.deepEqual(calls[2].values, [hash]);
});

test("bigint 문자열을 안전한 정수로 변환하고 허용 필드만 반환", async () => {
  const store = createPostgresSessionStore(async () => ({ rows: [
    { player_id: "me", issued_at_ms: "1000", expires_at_ms: "2000", secret: "hidden" },
  ] }));
  assert.deepEqual(await store.find(hash), session);
  assert.ok(Object.isFrozen(await store.find(hash)));
});

test("손상·과대 정수·빈 참가자·중복 행은 실패 처리", async () => {
  for (const rows of [
    [{ player_id: "me", issued_at_ms: "9007199254740992", expires_at_ms: "9007199254740993" }],
    [{ player_id: "me", issued_at_ms: "1e3", expires_at_ms: "2000" }],
    [{ player_id: "", issued_at_ms: 1000, expires_at_ms: 2000 }],
    [{ player_id: "me", issued_at_ms: 1000, expires_at_ms: 1000 }],
    [{ player_id: "me", issued_at_ms: 1000, expires_at_ms: 86401001 }], [{}, {}],
  ]) {
    await assert.rejects(createPostgresSessionStore(async () => ({ rows })).find(hash));
  }
});

test("잘못된 해시·세션은 DB 호출 전에 거절", async () => {
  let calls = 0;
  const store = createPostgresSessionStore(async () => { calls++; return { rows: [] }; });
  for (const invalid of ["", "x".repeat(64), "a".repeat(63), hash.toUpperCase()]) {
    await assert.rejects(store.find(invalid));
    await assert.rejects(store.delete(invalid));
    await assert.rejects(store.insert(invalid, session));
  }
  for (const invalid of [{ ...session, playerId: " me" }, { ...session, issuedAt: -1 },
    { ...session, expiresAt: NaN }, { ...session, playerId: "me\n" }]) {
    await assert.rejects(store.insert(hash, invalid));
  }
  assert.equal(calls, 0);
});

test("중복 키·DB 장애를 삼키지 않고 호출자에게 전달", async () => {
  const error = new Error("database unavailable");
  const store = createPostgresSessionStore(async () => { throw error; });
  for (const action of [() => store.insert(hash, session), () => store.find(hash), () => store.delete(hash)]) {
    await assert.rejects(action(), (value) => value === error);
  }
});

test("서로 다른 저장소 인스턴스에서 세션 발급·조회·로그아웃 연결", async () => {
  // SQL 엔진 대신 실행 계약을 모의합니다. 실제 PostgreSQL 검증은 별도로 필요합니다.
  const rows = new Map<string, Record<string, unknown>>();
  const query: SessionQuery = async (sql, values) => {
    const key = values[0] as string;
    if (sql.startsWith("INSERT")) {
      if (rows.has(key)) throw new Error("duplicate");
      rows.set(key, { player_id: values[1], issued_at_ms: String(values[2]), expires_at_ms: String(values[3]) });
    } else if (sql.startsWith("DELETE")) rows.delete(key);
    return { rows: sql.startsWith("SELECT") && rows.has(key) ? [rows.get(key)!] : [] };
  };
  const origin = "https://mafia.example";
  const first = createParticipantSessions({ origin, store: createPostgresSessionStore(query) });
  const second = createParticipantSessions({ origin, store: createPostgresSessionStore(query) });
  const cookie = (await first.issue("me")).split(";")[0];
  const request = new Request(origin, { method: "POST", headers: { origin, cookie } });
  assert.deepEqual(await second.authenticate(request), { playerId: "me" });
  assert.equal((await createLogoutHandler({ origin, sessions: second })(request)).status, 204);
  assert.equal(await first.authenticate(request), null);
  assert.equal(rows.size, 0);
});
