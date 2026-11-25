import assert from "node:assert/strict";
import test from "node:test";
import { createLogoutHandler } from "../src/server/auth/logout-handler";
import { createParticipantSessions, type ParticipantSession } from "../src/server/auth/participant-session";

const origin = "https://mafia.example";
function request(init: RequestInit = {}, url = origin) {
  return new Request(`${url}/api/logout`, { method: "POST", ...init,
    headers: { origin, ...init.headers } });
}

test("로그아웃은 서버 세션을 폐기한 뒤 보안 쿠키 삭제와 빈 204 응답", async () => {
  const rows = new Map<string, ParticipantSession>();
  const sessions = createParticipantSessions({ origin, store: {
    async insert(key, row) { rows.set(key, row); },
    async find(key) { return rows.get(key) ?? null; },
    async delete(key) { rows.delete(key); },
  } });
  const cookie = (await sessions.issue("me")).split(";")[0];
  const req = request({ headers: { cookie } });
  assert.deepEqual(await sessions.authenticate(req), { playerId: "me" });
  const handler = createLogoutHandler({ origin, sessions });
  const response = await handler(req);
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("set-cookie")!, /HttpOnly; SameSite=Strict; Secure; Max-Age=0$/u);
  assert.equal(await sessions.authenticate(req), null);
  assert.equal((await handler(request())).status, 204);
  assert.equal((await handler(req)).status, 204);
});

test("다른 메서드·출처·누락 출처는 폐기 호출 없이 거절", async () => {
  let calls = 0;
  const handler = createLogoutHandler({ origin, sessions: { async revoke() { calls++; return ""; } } });
  const get = await handler(request({ method: "GET" }));
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("allow"), "POST");
  for (const req of [request({ headers: { origin: "https://evil.example" } }),
    request({}, "https://evil.example"), new Request(origin, { method: "POST" }), request({ headers: { origin: "null" } })]) {
    const response = await handler(req);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(calls, 0);
});

test("저장소 삭제 실패는 일반 오류이며 쿠키만 지우고 성공하지 않음", async () => {
  const handler = createLogoutHandler({ origin, sessions: { async revoke() { throw new Error("SECRET-DATABASE"); } } });
  const response = await handler(request());
  assert.equal(response.status, 500);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.deepEqual(await response.json(), { error: "internal-error" });
});

test("삭제가 완료되기 전에 성공 응답을 반환하지 않으며 연결 취소도 폐기를 막지 않음", async () => {
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => { finish = resolve; });
  let completed = false;
  const handler = createLogoutHandler({ origin, sessions: { async revoke() { await gate; return "session=; Max-Age=0"; } } });
  const abort = new AbortController();
  const pending = handler(request({ signal: abort.signal })).then((response) => { completed = true; return response; });
  abort.abort();
  await Promise.resolve();
  assert.equal(completed, false);
  finish();
  assert.equal((await pending).status, 204);
});

test("고정 출처 설정을 검사하고 localhost 개발 요청을 지원", async () => {
  const sessions = { async revoke() { return "mafia-local-session=; Max-Age=0"; } };
  for (const bad of ["http://mafia.example", `${origin}/`, "ftp://mafia.example", "https://user:pass@mafia.example"]) {
    assert.throws(() => createLogoutHandler({ origin: bad, sessions }));
  }
  const local = "http://localhost:3000";
  const handler = createLogoutHandler({ origin: local, sessions });
  assert.equal((await handler(request({ headers: { origin: local } }, local))).status, 204);
});
