import assert from "node:assert/strict";
import test from "node:test";
import { createDialogueBudget } from "../src/components/mafia/dialogue/budget";
import { createDialogueCoordinator } from "../src/components/mafia/dialogue/coordinator";
import type { DialogueContext, ProviderInput } from "../src/components/mafia/dialogue/types";
import { createMeteredDialogueProvider, type PreparedDialogueCall } from "../src/server/dialogue/metered-provider";

const context: DialogueContext = {
  gameId: "game-1", round: 1, phase: "day", kind: "interrogation",
  speaker: { id: "npc", name: "회색 후드", role: "citizen" },
  participants: [{ id: "npc", name: "회색 후드", alive: true }],
  publicMessages: [{ sender: "사회자", text: "토론을 시작합니다." }],
  question: { actorId: "me", text: "어젯밤 어디에 있었나요?" },
};
const fallback = "제 진술은 같습니다.";
function request(requestId = "r1") { return { requestId, context: structuredClone(context), fallback }; }
function budget(maxReservedMicroUsd = 250, maxInputTokens = 1000) {
  return createDialogueBudget({
    maxRequests: 10, maxInputTokens, maxOutputTokens: 100, maxReservedMicroUsd,
    inputMicroUsdPerMillionTokens: 1_000_000, outputMicroUsdPerMillionTokens: 2_000_000,
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}
function fixture(options: {
  ledger?: ReturnType<typeof budget>;
  prepare?: (input: ProviderInput, signal: AbortSignal) => Promise<PreparedDialogueCall>;
  providerKey?: string;
  timeoutMs?: number;
  isCurrent?: () => boolean;
} = {}) {
  const ledger = options.ledger ?? budget();
  const preparedInputs: ProviderInput[] = [];
  const invocations: { signal: AbortSignal; maxOutputTokens: number }[] = [];
  const provider = createMeteredDialogueProvider({
    gameId: "game-1", providerKey: options.providerKey ?? "test-model-v1", budget: ledger,
    isCurrent: options.isCurrent ?? (() => true),
    async prepare(input, { signal }) {
      preparedInputs.push(input);
      if (options.prepare) return options.prepare(input, signal);
      return {
        inputTokens: 50,
        async invoke(call) {
          assert.ok(ledger.snapshot().requests > 0);
          invocations.push(call);
          return { text: "밤에는 집에서 쉬었습니다." };
        },
      };
    },
  });
  const service = createDialogueCoordinator({ gameId: "game-1", provider, isCurrent: options.isCurrent ?? (() => true), timeoutMs: options.timeoutMs });
  return { ledger, provider, service, preparedInputs, invocations };
}

test("지침·질문을 포함한 전체 입력 계산 후 예약하고 출력 토큰 상한을 실제 호출에 전달", async () => {
  const f = fixture();
  assert.deepEqual(await f.service.request(request()), { status: "ready", source: "provider", text: "밤에는 집에서 쉬었습니다." });
  assert.ok(f.preparedInputs[0].instructions.includes("한국어"));
  assert.equal(f.preparedInputs[0].context.question?.text, context.question?.text);
  assert.equal(f.preparedInputs[0].maxOutputChars, 280);
  assert.equal(f.invocations[0].maxOutputTokens, 100);
  assert.equal(f.ledger.snapshot().reservedMicroUsd, 250);
  assert.ok(f.service.claim("r1"));
  assert.equal(f.service.claim("r1"), null);
  f.service.dispose();
});

test("같은 요청의 동시 호출·완료 후 재시도는 계산·예약·생성을 한 번만 수행", async () => {
  const f = fixture();
  await Promise.all(Array.from({ length: 10 }, () => f.service.request(request())));
  await f.service.request(request());
  assert.equal(f.preparedInputs.length, 1);
  assert.equal(f.invocations.length, 1);
  assert.equal(f.ledger.snapshot().requests, 1);
  assert.deepEqual(await f.service.request({ ...request(), fallback: "변경된 대사" }), { status: "discarded", reason: "conflict" });
  assert.equal(f.preparedInputs.length, 1);
  f.service.dispose();
});

test("서로 다른 동시 요청이 남은 예산을 함께 초과하면 하나만 생성", async () => {
  const f = fixture();
  const results = await Promise.all([f.service.request(request("r1")), f.service.request(request("r2"))]);
  assert.equal(results.filter((r) => r.status === "ready" && r.source === "provider").length, 1);
  assert.equal(results.filter((r) => r.status === "ready" && r.source === "fallback").length, 1);
  assert.equal(f.invocations.length, 1);
  assert.equal(f.ledger.snapshot().reservedMicroUsd, 250);
  f.service.dispose();
});

test("예산 부족·입력 토큰 초과는 유료 생성 없이 기존 대사로 전환", async () => {
  for (const ledger of [budget(0), budget(500, 10)]) {
    const f = fixture({ ledger });
    assert.deepEqual(await f.service.request(request()), { status: "ready", source: "fallback", text: fallback, reason: "provider-error" });
    assert.equal(f.invocations.length, 0);
    assert.equal(ledger.snapshot().reservedMicroUsd, 0);
    assert.equal(ledger.snapshot().requests, 0);
    f.service.dispose();
  }
});

test("토큰 계산 예외·잘못된 토큰 수는 예약하지 않고 비밀 오류를 숨김", async () => {
  for (const tokens of [null, NaN, 0, 0.5]) {
    let calls = 0;
    const f = fixture({ prepare: async () => {
      if (tokens === null) throw new Error("SECRET-API-KEY");
      return { inputTokens: tokens, async invoke() { calls++; return { text: "정상" }; } };
    } });
    const result = await f.service.request(request());
    assert.deepEqual(result, { status: "ready", source: "fallback", text: fallback, reason: "provider-error" });
    assert.ok(!JSON.stringify(result).includes("SECRET"));
    assert.equal(calls, 0);
    assert.equal(f.ledger.snapshot().requests, 0);
    f.service.dispose();
  }
});

test("토큰 계산 중 취소·폐기 시 늦게 끝난 계산은 예약·생성을 하지 않음", async () => {
  for (const action of ["cancel", "dispose"] as const) {
    const started = deferred<void>();
    const gate = deferred<PreparedDialogueCall>();
    let calls = 0;
    const f = fixture({ prepare: async () => { started.resolve(); return gate.promise; } });
    const pending = f.service.request(request());
    await started.promise;
    if (action === "cancel") f.service.cancel("r1"); else f.service.dispose();
    assert.deepEqual(await pending, { status: "discarded", reason: action === "cancel" ? "cancelled" : "disposed" });
    gate.resolve({ inputTokens: 50, async invoke() { calls++; return { text: "늦은 응답" }; } });
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(calls, 0);
    assert.equal(f.ledger.snapshot().requests, 0);
    f.service.dispose();
  }
});

test("토큰 계산 중 시간 초과 후 늦은 완료도 비용을 예약하지 않음", async () => {
  const gate = deferred<PreparedDialogueCall>();
  let calls = 0;
  const f = fixture({ timeoutMs: 10, prepare: async () => gate.promise });
  assert.deepEqual(await f.service.request(request()), { status: "ready", source: "fallback", text: fallback, reason: "timeout" });
  gate.resolve({ inputTokens: 50, async invoke() { calls++; return { text: "늦은 응답" }; } });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(calls, 0);
  assert.equal(f.ledger.snapshot().requests, 0);
  f.service.dispose();
});

test("생성 시작 후 예외·시간 초과·잘못된 출력에도 예약 금액은 유지", async () => {
  for (const mode of ["error", "timeout", "invalid"] as const) {
    let signal: AbortSignal | undefined;
    const gate = deferred<unknown>();
    const f = fixture({ timeoutMs: 10, prepare: async () => ({
      inputTokens: 50,
      async invoke(call) {
        signal = call.signal;
        if (mode === "error") throw new Error("SECRET");
        if (mode === "timeout") return gate.promise;
        return { text: "저는 마피아입니다." };
      },
    }) });
    const result = await f.service.request(request());
    assert.equal(result.status, "ready");
    if (result.status === "ready") assert.equal(result.source, "fallback");
    assert.equal(f.ledger.snapshot().reservedMicroUsd, 250);
    if (mode === "timeout") assert.equal(signal?.aborted, true);
    gate.resolve({ text: "늦은 응답" });
    await f.service.request(request());
    assert.equal(f.ledger.snapshot().requests, 1);
    f.service.dispose();
  }
});

test("같은 장부에 조정기를 새로 만들어도 승인 ID를 다시 생성하지 않음", async () => {
  const first = fixture();
  await first.service.request(request());
  first.service.dispose();
  const again = fixture({ ledger: first.ledger });
  assert.deepEqual(await again.service.request(request()), { status: "ready", source: "fallback", text: fallback, reason: "provider-error" });
  assert.equal(again.invocations.length, 0);
  assert.equal(first.ledger.snapshot().requests, 1);
  again.service.dispose();
});

test("입력·공급자 설정이 바뀐 동일 ID는 장부 지문이 충돌하여 재생성하지 않음", async () => {
  for (const change of ["context", "provider"] as const) {
    const first = fixture({ ledger: budget(1000) });
    await first.service.request(request());
    first.service.dispose();
    const again = fixture({ ledger: first.ledger, providerKey: change === "provider" ? "test-model-v2" : undefined });
    const input = request();
    if (change === "context") input.context.speaker.name = "다른 이름";
    const result = await again.service.request(input);
    assert.equal(result.status, "ready");
    if (result.status === "ready") assert.equal(result.source, "fallback");
    assert.equal(again.invocations.length, 0);
    assert.equal(first.ledger.snapshot().requests, 1);
    again.service.dispose();
  }
});

test("다른 게임·이미 취소된 직접 호출은 입력 계산과 예약 전 거절", async () => {
  const f = fixture();
  const input: ProviderInput = { instructions: "지침", context: { ...context, gameId: "other" }, maxOutputChars: 280 };
  await assert.rejects(f.provider.generate(input, { requestId: "r1", signal: new AbortController().signal }));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(f.provider.generate({ ...input, context }, { requestId: "r1", signal: controller.signal }));
  assert.equal(f.preparedInputs.length, 0);
  assert.equal(f.ledger.snapshot().requests, 0);
  f.service.dispose();
});

test("게임·공급자 설정 ID가 무효이면 생성 단계에서 거절", () => {
  const ledger = budget();
  for (const id of ["", " ", "x".repeat(129)]) {
    const prepare = async () => ({ inputTokens: 50, invoke: async () => ({ text: "정상" }) });
    assert.throws(() => createMeteredDialogueProvider({ gameId: id, providerKey: "v1", budget: ledger, prepare, isCurrent: () => true }), RangeError);
    assert.throws(() => createMeteredDialogueProvider({ gameId: "game-1", providerKey: id, budget: ledger, prepare, isCurrent: () => true }), RangeError);
  }
});

test("토큰 계산 중 단계가 바뀌면 별도 취소 없이도 예약·생성을 차단", async () => {
  let current = true;
  const started = deferred<void>();
  const gate = deferred<PreparedDialogueCall>();
  let calls = 0;
  const f = fixture({ isCurrent: () => current, prepare: async () => { started.resolve(); return gate.promise; } });
  const pending = f.service.request(request());
  await started.promise;
  current = false;
  gate.resolve({ inputTokens: 50, async invoke() { calls++; return { text: "오래된 응답" }; } });
  assert.deepEqual(await pending, { status: "discarded", reason: "stale" });
  assert.equal(calls, 0);
  assert.equal(f.ledger.snapshot().requests, 0);
  f.service.dispose();
});
