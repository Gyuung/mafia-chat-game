import assert from "node:assert/strict";
import test from "node:test";
import { createDialogueCoordinator } from "../src/components/mafia/dialogue/coordinator";
import type { GameState } from "../src/components/mafia/engine/types";
import type { InternalMessage } from "../src/components/mafia/engine/view";
import { createDialogueRequestHandler, type DialogueGameAccess } from "../src/server/dialogue/request-handler";
import { fakeDialogueProvider } from "./fixtures/fake-dialogue-provider";
import { createParticipantSessions, type ParticipantSession } from "../src/server/auth/participant-session";

const origin = "https://mafia.example";
const fallback = "제 진술은 같습니다.";

test("서버 세션 인증을 요청 처리기에 연결하고 폐기·사칭을 거절", async () => {
  const rows = new Map<string, ParticipantSession>();
  const sessions = createParticipantSessions({ origin, store: {
    async insert(key, row) { rows.set(key, row); },
    async find(key) { return rows.get(key) ?? null; },
    async delete(key) { rows.delete(key); },
  } });
  const cookie = (await sessions.issue("me")).split(";")[0];
  const f = fixture({ authenticate: sessions.authenticate });
  assert.equal((await f.handler(request(input(), { headers: { cookie } }))).status, 200);
  assert.equal((await f.handler(request(input(), { headers: { "x-test-player": "me" } }))).status, 401);
  await sessions.revoke(new Request(origin, { headers: { cookie } }));
  assert.equal((await f.handler(request(input(), { headers: { cookie } }))).status, 401);
  const outsider = (await sessions.issue("outsider")).split(";")[0];
  assert.equal((await f.handler(request(input(), { headers: { cookie: outsider } }))).status, 404);
});
const initial: GameState = {
  phase: "day", round: 1, winner: null, votes: {}, nightActions: {},
  players: [
    { id: "me", name: "수사관", human: true, role: "detective", alive: true, suspicion: 0, trust: {} },
    { id: "other", name: "다른 참가자", human: true, role: "doctor", alive: true, suspicion: 0, trust: {} },
    { id: "npc", name: "회색 후드", human: false, role: "mafia", alive: true, suspicion: 99, trust: {} },
    { id: "dead", name: "떠난 참가자", human: false, role: "citizen", alive: false, suspicion: 0, trust: {} },
  ],
};
const messages: InternalMessage[] = [
  { id: "public", sender: "사회자", text: "토론을 시작합니다.", audience: { type: "public" } },
  { id: "secret", sender: "사회자", text: "PRIVATE-INVESTIGATION", audience: { type: "private", playerId: "me" } },
];
function input() {
  return { gameId: "g1", requestId: "r1", speakerId: "npc", kind: "discussion", expectedRound: 1, expectedPhase: "day" };
}
function request(value: unknown = input(), init: RequestInit = {}) {
  return new Request(`${origin}/api/dialogue`, {
    method: "POST", body: JSON.stringify(value), ...init,
    headers: { origin, "content-type": "application/json", ...init.headers },
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}
function fixture(options: {
  reply?: () => Promise<unknown>;
  disabled?: boolean;
  maxRequests?: number;
  authenticate?: (request: Request) => Promise<{ playerId: string } | null>;
} = {}) {
  const state = structuredClone(initial);
  const fake = fakeDialogueProvider(options.reply ?? (async () => ({ text: "그날 밤에는 집에 있었습니다." })));
  const coordinator = createDialogueCoordinator({
    gameId: "g1", provider: options.disabled ? undefined : fake.provider, maxRequests: options.maxRequests,
    isCurrent: (context) => context.round === state.round && context.phase === state.phase,
  });
  let game: DialogueGameAccess | null = { gameId: "g1", state, messages, coordinator };
  let authCalls = 0;
  let loads = 0;
  const handler = createDialogueRequestHandler({
    origin, fallback,
    async authenticate(request) {
      authCalls++;
      if (options.authenticate) return options.authenticate(request);
      return { playerId: request.headers.get("x-test-player") ?? "me" };
    },
    async loadGame(gameId) { loads++; return gameId === "g1" ? game : null; },
  });
  return { handler, state, fake, coordinator, setGame(value: DialogueGameAccess | null) { game = value; }, counts: () => ({ authCalls, loads }) };
}

test("인증·게임 확인 후 서버 상태만 모델 입력에 쓰고 응답에는 대사만 반환", async () => {
  const f = fixture();
  const result = await f.handler(request());
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.equal(result.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(await result.json(), { requestId: "r1", source: "provider", text: "그날 밤에는 집에 있었습니다." });
  assert.deepEqual(f.counts(), { authCalls: 2, loads: 2 });
  const serialized = JSON.stringify(f.fake.calls[0].input);
  assert.ok(!serialized.includes("PRIVATE-"));
  assert.ok(!serialized.includes('"role":"detective"'));
  assert.ok(!serialized.includes('"role":"doctor"'));
  assert.ok(!serialized.includes('"suspicion"'));
  f.coordinator.dispose();
});

test("미인증 요청은 게임 조회와 공급자 호출 전에 거절", async () => {
  const f = fixture({ authenticate: async () => null });
  const response = await f.handler(request());
  assert.equal(response.status, 401);
  assert.deepEqual(f.counts(), { authCalls: 1, loads: 0 });
  assert.equal(f.fake.calls.length, 0);
  f.coordinator.dispose();
});

test("다른 출처·출처 누락은 인증·게임 조회 없이 거절", async () => {
  const f = fixture();
  for (const header of ["https://evil.example", "null", ""]) {
    assert.equal((await f.handler(request(input(), { headers: { origin: header } }))).status, 403);
  }
  const wrongUrl = new Request("https://other.example/api/dialogue", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(input()) });
  assert.equal((await f.handler(wrongUrl)).status, 403);
  assert.deepEqual(f.counts(), { authCalls: 0, loads: 0 });
  f.coordinator.dispose();
});

test("POST JSON 외 요청은 메서드·형식 오류로 거절", async () => {
  const f = fixture();
  const method = await f.handler(new Request(`${origin}/api/dialogue`));
  assert.equal(method.status, 405);
  assert.equal(method.headers.get("allow"), "POST");
  assert.equal((await f.handler(request(input(), { headers: { "content-type": "text/plain" } }))).status, 415);
  assert.deepEqual(f.counts(), { authCalls: 0, loads: 0 });
  f.coordinator.dispose();
});

test("본문 상한은 Content-Length와 실제 스트림 바이트 모두 검사", async () => {
  const f = fixture();
  assert.equal((await f.handler(request(input(), { headers: { "content-length": "5000" } }))).status, 413);
  assert.equal((await f.handler(request("x".repeat(5000), { headers: { "content-length": "10" } }))).status, 413);
  assert.equal((await f.handler(request("한".repeat(1500)))).status, 413);
  assert.equal(f.counts().loads, 0);
  assert.equal(f.fake.calls.length, 0);
  f.coordinator.dispose();
});

test("JSON 오류·추가 필드·사칭·잘못된 ID/단계/라운드는 조회 전에 거절", async () => {
  const f = fixture();
  for (const value of [null, [], "문자열", {}, { ...input(), context: initial }, { ...input(), role: "mafia" },
    { ...input(), actorId: "other" }, { ...input(), requestId: " " }, { ...input(), gameId: "x".repeat(129) },
    { ...input(), speakerId: "bad\u0000" }, { ...input(), expectedRound: 0 }, { ...input(), expectedRound: 0.5 },
    { ...input(), expectedPhase: "night" }, { ...input(), kind: "vote" }, { ...input(), question: "일반 발언에 질문 추가" }]) {
    assert.equal((await f.handler(request(value))).status, 400);
  }
  assert.equal((await f.handler(request(input(), { body: "{" }))).status, 400);
  assert.equal(f.counts().loads, 0);
  assert.equal(f.fake.calls.length, 0);
  f.coordinator.dispose();
});

test("존재하지 않는 게임·비참가자·NPC 사칭은 같은 비공개 오류로 거절", async () => {
  const f = fixture();
  const missing = await f.handler(request({ ...input(), gameId: "missing" }));
  const outsider = await f.handler(request(input(), { headers: { "x-test-player": "outsider" } }));
  const npc = await f.handler(request(input(), { headers: { "x-test-player": "npc" } }));
  for (const response of [missing, outsider, npc]) {
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "unavailable" });
  }
  f.setGame({ gameId: "other-game", state: f.state, messages, coordinator: f.coordinator });
  assert.equal((await f.handler(request())).status, 404);
  assert.equal(f.fake.calls.length, 0);
  f.coordinator.dispose();
});

test("탈락한 요청자와 현재 단계·라운드가 다른 요청은 생성 전에 거절", async () => {
  const f = fixture();
  f.state.players[0].alive = false;
  assert.equal((await f.handler(request())).status, 403);
  f.state.players[0].alive = true;
  for (const value of [{ ...input(), expectedRound: 2 }, { ...input(), expectedPhase: "vote" }]) {
    assert.equal((await f.handler(request(value))).status, 409);
  }
  f.state.phase = "ended";
  assert.equal((await f.handler(request())).status, 409);
  assert.equal(f.fake.calls.length, 0);
  f.coordinator.dispose();
});

test("사람·탈락 NPC·없는 NPC는 발언 대상이 될 수 없음", async () => {
  const f = fixture();
  for (const speakerId of ["me", "other", "dead", "missing"]) {
    assert.equal((await f.handler(request({ ...input(), speakerId }))).status, 400);
  }
  assert.equal(f.fake.calls.length, 0);
  f.coordinator.dispose();
});

test("심문 행위자는 세션에서 가져오고 빈 질문·객체·장문을 거절", async () => {
  const f = fixture();
  for (const question of [undefined, " ", { actorId: "other", text: "사칭" }, "가".repeat(401)]) {
    assert.equal((await f.handler(request({ ...input(), kind: "interrogation", question }))).status, 400);
  }
  const response = await f.handler(request({ ...input(), kind: "interrogation", question: "어디에 있었나요?" }));
  assert.equal(response.status, 200);
  assert.equal(f.fake.calls[0].input.context.question?.actorId, "me");
  f.coordinator.dispose();
});

test("같은 참가자의 동시 중복과 완료 재전송은 같은 결과·한 번의 생성", async () => {
  const f = fixture();
  const responses = await Promise.all([f.handler(request()), f.handler(request())]);
  const data = await Promise.all(responses.map((r) => r.json()));
  assert.deepEqual(data[0], data[1]);
  assert.deepEqual(await (await f.handler(request())).json(), data[0]);
  assert.equal(f.fake.calls.length, 1);
  f.coordinator.dispose();
});

test("동일 ID의 다른 질문은 충돌하며 서로 다른 참가자의 ID는 분리", async () => {
  const f = fixture();
  const first = { ...input(), kind: "interrogation", question: "첫 질문" };
  assert.equal((await f.handler(request(first))).status, 200);
  assert.equal((await f.handler(request({ ...first, question: "다른 질문" }))).status, 409);
  assert.equal((await f.handler(request(first, { headers: { "x-test-player": "other" } }))).status, 200);
  assert.equal(f.fake.calls.length, 2);
  assert.deepEqual(f.fake.calls.map((call) => call.input.context.question?.actorId), ["me", "other"]);
  f.coordinator.dispose();
});

test("응답 대기 중 퇴장·탈락·단계 변경은 결과를 노출하지 않음", async () => {
  for (const change of ["leave", "die", "phase"] as const) {
    const started = deferred<void>();
    const gate = deferred<unknown>();
    const f = fixture({ reply: async () => { started.resolve(); return gate.promise; } });
    const pending = f.handler(request());
    await started.promise;
    if (change === "leave") f.setGame(null);
    if (change === "die") f.state.players[0].alive = false;
    if (change === "phase") f.state.phase = "vote";
    gate.resolve({ text: "노출하면 안 되는 늦은 응답" });
    const response = await pending;
    assert.equal(response.status, change === "leave" ? 404 : change === "die" ? 403 : 409);
    assert.deepEqual(await response.json(), { error: "unavailable" });
    f.coordinator.dispose();
  }
});

test("응답 직전 세션 만료는 대사를 반환하지 않음", async () => {
  let count = 0;
  const f = fixture({ authenticate: async () => ++count === 1 ? { playerId: "me" } : null });
  assert.equal((await f.handler(request())).status, 401);
  assert.equal(f.fake.calls.length, 1);
  f.coordinator.dispose();
});

test("한 연결의 취소가 같은 요청을 기다리는 다른 연결을 취소하지 않음", async () => {
  const started = deferred<void>();
  const gate = deferred<unknown>();
  const f = fixture({ reply: async () => { started.resolve(); return gate.promise; } });
  const controller = new AbortController();
  const cancelled = f.handler(request(input(), { signal: controller.signal }));
  const active = f.handler(request());
  await started.promise;
  controller.abort();
  gate.resolve({ text: "정상 응답입니다." });
  assert.equal((await cancelled).status, 408);
  assert.equal((await active).status, 200);
  assert.equal(f.fake.calls.length, 1);
  f.coordinator.dispose();
});

test("공급자 비활성은 대체 대사로 정상 응답하고 요청 상한은 429", async () => {
  const disabled = fixture({ disabled: true });
  assert.deepEqual(await (await disabled.handler(request())).json(), { requestId: "r1", source: "fallback", text: fallback });
  disabled.coordinator.dispose();
  const f = fixture({ maxRequests: 1 });
  await f.handler(request());
  assert.equal((await f.handler(request({ ...input(), requestId: "r2" }))).status, 429);
  f.coordinator.dispose();
});

test("의존성 오류·이미 취소된 요청은 내부 정보 없는 오류로 반환", async () => {
  const f = fixture({ authenticate: async () => { throw new Error("SECRET-SESSION-KEY"); } });
  const response = await f.handler(request());
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "internal-error" });
  const controller = new AbortController();
  controller.abort();
  assert.equal((await f.handler(request(input(), { signal: controller.signal }))).status, 408);
  assert.equal(f.fake.calls.length, 0);
  f.coordinator.dispose();
});

test("잘못된 출처·대체 대사 설정은 초기화에서 거절", () => {
  const options = { origin, fallback, authenticate: async () => null, loadGame: async () => null };
  for (const badOrigin of ["file:///tmp/game", "https://mafia.example/path", "https://mafia.example/"]) {
    assert.throws(() => createDialogueRequestHandler({ ...options, origin: badOrigin }));
  }
  for (const badFallback of [" ", "가".repeat(281)]) {
    assert.throws(() => createDialogueRequestHandler({ ...options, fallback: badFallback }), RangeError);
  }
});
