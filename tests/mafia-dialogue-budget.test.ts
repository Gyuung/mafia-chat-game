import assert from "node:assert/strict";
import test from "node:test";
import { createDialogueBudget, type DialogueBudgetLimits } from "../src/components/mafia/dialogue/budget";

const limits: DialogueBudgetLimits = {
  maxRequests: 3, maxInputTokens: 1000, maxOutputTokens: 100,
  maxReservedMicroUsd: 500,
  inputMicroUsdPerMillionTokens: 1_000_000,
  outputMicroUsdPerMillionTokens: 2_000_000,
};
function input(requestId = "r1", inputTokens = 50) {
  return { requestId, fingerprint: `문맥-${requestId}`, inputTokens };
}

test("입력 전체와 출력 최대 비용을 예약하고 예산 경계까지 승인", () => {
  const budget = createDialogueBudget(limits);
  const result = budget.reserve(input());
  assert.deepEqual(result, {
    status: "reserved", duplicate: false,
    reservation: { requestId: "r1", inputTokens: 50, maxOutputTokens: 100, reservedMicroUsd: 250 },
  });
  assert.equal(budget.reserve(input("r2")).status, "reserved");
  assert.deepEqual(budget.snapshot(), { requests: 2, reservedMicroUsd: 500, remainingMicroUsd: 0 });
  assert.deepEqual(budget.reserve(input("r3")), { status: "rejected", reason: "budget" });
  assert.equal(budget.snapshot().requests, 2);
});

test("예산이 소진되어도 동일 요청 재시도는 추가 예약 없이 재사용", () => {
  const budget = createDialogueBudget({ ...limits, maxRequests: 1, maxReservedMicroUsd: 250 });
  const first = budget.reserve(input());
  const again = budget.reserve(input());
  assert.equal(first.status, "reserved");
  assert.equal(again.status, "reserved");
  if (first.status !== "reserved" || again.status !== "reserved") return;
  assert.equal(again.duplicate, true);
  assert.equal(again.reservation, first.reservation);
  assert.deepEqual(budget.snapshot(), { requests: 1, reservedMicroUsd: 250, remainingMicroUsd: 0 });
});

test("동일 ID의 다른 문맥이나 토큰 수는 충돌로 거절", () => {
  const budget = createDialogueBudget(limits);
  budget.reserve(input());
  for (const changed of [{ ...input(), fingerprint: "다른 문맥" }, { ...input(), inputTokens: 51 }]) {
    assert.deepEqual(budget.reserve(changed), { status: "rejected", reason: "conflict" });
  }
  assert.equal(budget.snapshot().reservedMicroUsd, 250);
});

test("토큰 상한과 요청 수 상한 거절은 예약 상태를 바꾸지 않음", () => {
  const budget = createDialogueBudget({ ...limits, maxRequests: 1 });
  assert.deepEqual(budget.reserve(input("큰 요청", 1001)), { status: "rejected", reason: "input-limit" });
  assert.equal(budget.snapshot().requests, 0);
  budget.reserve(input());
  assert.deepEqual(budget.reserve(input("r2")), { status: "rejected", reason: "capacity" });
  assert.equal(budget.snapshot().requests, 1);
});

test("부분 마이크로달러 비용은 입력·출력별로 올림하며 무료 단가는 허용", () => {
  const budget = createDialogueBudget({
    ...limits, inputMicroUsdPerMillionTokens: 1, outputMicroUsdPerMillionTokens: 1,
  });
  budget.reserve(input());
  assert.equal(budget.snapshot().reservedMicroUsd, 2);
  const free = createDialogueBudget({
    ...limits, maxReservedMicroUsd: 0, inputMicroUsdPerMillionTokens: 0, outputMicroUsdPerMillionTokens: 0,
  });
  assert.equal(free.reserve(input()).status, "reserved");
  assert.equal(free.snapshot().reservedMicroUsd, 0);
});

test("큰 토큰·단가 곱셈도 정밀도를 잃지 않고 예산 초과를 거절", () => {
  const huge = Number.MAX_SAFE_INTEGER;
  const budget = createDialogueBudget({
    ...limits, maxInputTokens: huge, maxOutputTokens: huge, maxReservedMicroUsd: huge,
    inputMicroUsdPerMillionTokens: huge, outputMicroUsdPerMillionTokens: huge,
  });
  assert.deepEqual(budget.reserve(input("큰 요청", huge)), { status: "rejected", reason: "budget" });
  assert.equal(budget.snapshot().requests, 0);
  const affordable = createDialogueBudget({
    ...limits, maxInputTokens: huge, maxReservedMicroUsd: huge,
    inputMicroUsdPerMillionTokens: 1, outputMicroUsdPerMillionTokens: 0,
  });
  affordable.reserve(input("큰 입력", huge));
  assert.equal(affordable.snapshot().reservedMicroUsd, 9_007_199_255);
});

test("동시 진입도 외부 작업을 시작하기 전에 한 번만 예약", async () => {
  const budget = createDialogueBudget({ ...limits, maxReservedMicroUsd: 250 });
  const results = await Promise.all(Array.from({ length: 20 }, () => Promise.resolve().then(() => budget.reserve(input()))));
  assert.equal(results.filter((r) => r.status === "reserved" && !r.duplicate).length, 1);
  assert.equal(results.filter((r) => r.status === "reserved" && r.duplicate).length, 19);
  assert.equal(budget.snapshot().reservedMicroUsd, 250);
});

test("잘못된 설정·요청은 상태 변경 없이 거절", () => {
  for (const key of Object.keys(limits) as (keyof DialogueBudgetLimits)[]) {
    for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => createDialogueBudget({ ...limits, [key]: value }), RangeError);
    }
  }
  for (const key of ["maxRequests", "maxInputTokens", "maxOutputTokens"] as const) {
    assert.throws(() => createDialogueBudget({ ...limits, [key]: 0 }), RangeError);
  }
  const budget = createDialogueBudget(limits);
  for (const bad of [
    { ...input(), requestId: " " }, { ...input(), requestId: "x".repeat(129) },
    { ...input(), fingerprint: "" }, { ...input(), fingerprint: "x".repeat(129) },
    ...[0, -1, NaN, Infinity, 0.5].map((inputTokens) => ({ ...input(), inputTokens })),
  ]) {
    assert.deepEqual(budget.reserve(bad), { status: "rejected", reason: "invalid-request" });
  }
  assert.deepEqual(budget.snapshot(), { requests: 0, reservedMicroUsd: 0, remainingMicroUsd: 500 });
});

test("설정·입력·결과를 외부에서 바꿔도 기존 예약을 변경할 수 없음", () => {
  const config = { ...limits };
  const budget = createDialogueBudget(config);
  config.maxOutputTokens = 1;
  config.maxReservedMicroUsd = 0;
  const request = input();
  const result = budget.reserve(request);
  request.inputTokens = 999;
  request.fingerprint = "변경";
  assert.equal(result.status, "reserved");
  if (result.status !== "reserved") return;
  assert.equal(result.reservation.maxOutputTokens, 100);
  assert.equal(result.reservation.inputTokens, 50);
  assert.equal(Object.isFrozen(result.reservation), true);
  const snapshot = budget.snapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  budget.reserve(input("r2"));
  assert.equal(snapshot.reservedMicroUsd, 250);
  assert.equal(budget.snapshot().reservedMicroUsd, 500);
});

test("실패·취소 이후의 새 요청에도 이미 예약한 비용을 계속 포함", () => {
  const budget = createDialogueBudget({ ...limits, maxReservedMicroUsd: 250 });
  budget.reserve(input("실패한 요청"));
  assert.deepEqual(budget.reserve(input("재시도 새 ID")), { status: "rejected", reason: "budget" });
  assert.equal(budget.reserve(input("실패한 요청")).status, "reserved");
});
