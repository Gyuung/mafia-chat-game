export type DialogueBudgetLimits = {
  maxRequests: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxReservedMicroUsd: number;
  inputMicroUsdPerMillionTokens: number;
  outputMicroUsdPerMillionTokens: number;
};

export type DialogueReservation = Readonly<{
  requestId: string;
  inputTokens: number;
  maxOutputTokens: number;
  reservedMicroUsd: number;
}>;

export type DialogueBudgetResult =
  | { status: "reserved"; duplicate: boolean; reservation: DialogueReservation }
  | { status: "rejected"; reason: "invalid-request" | "input-limit" | "conflict" | "capacity" | "budget" };

type ReservationInput = { requestId: string; fingerprint: string; inputTokens: number };

function integer(value: number, minimum: number) {
  return Number.isSafeInteger(value) && value >= minimum;
}

// 인증된 서버 호출자가 게임마다 하나씩 만들고, 같은 게임의 모든 요청에 공유합니다.
export function createDialogueBudget(limits: DialogueBudgetLimits) {
  const {
    maxRequests, maxInputTokens, maxOutputTokens, maxReservedMicroUsd,
    inputMicroUsdPerMillionTokens, outputMicroUsdPerMillionTokens,
  } = limits;
  for (const value of [maxRequests, maxInputTokens, maxOutputTokens]) {
    if (!integer(value, 1)) throw new RangeError("요청 수와 토큰 상한은 양의 안전한 정수여야 합니다.");
  }
  for (const value of [maxReservedMicroUsd, inputMicroUsdPerMillionTokens, outputMicroUsdPerMillionTokens]) {
    if (!integer(value, 0)) throw new RangeError("예산과 단가는 0 이상의 안전한 정수여야 합니다.");
  }

  const reservations = new Map<string, { fingerprint: string; reservation: DialogueReservation }>();
  let reservedMicroUsd = 0;
  const million = BigInt(1_000_000);

  function reserve(input: ReservationInput): DialogueBudgetResult {
    if (typeof input.requestId !== "string" || !input.requestId.trim() || input.requestId.length > 128
      || typeof input.fingerprint !== "string" || !input.fingerprint.trim() || input.fingerprint.length > 128
      || !integer(input.inputTokens, 1)) {
      return { status: "rejected", reason: "invalid-request" };
    }
    const before = reservations.get(input.requestId);
    if (before) {
      if (before.fingerprint !== input.fingerprint || before.reservation.inputTokens !== input.inputTokens) {
        return { status: "rejected", reason: "conflict" };
      }
      return { status: "reserved", duplicate: true, reservation: before.reservation };
    }
    if (input.inputTokens > maxInputTokens) return { status: "rejected", reason: "input-limit" };
    if (reservations.size >= maxRequests) return { status: "rejected", reason: "capacity" };

    // 입력 전체와 출력 최대치 각각을 올림 계산하며, 곱셈 중 정수 정밀도를 보존합니다.
    const inputCost = (BigInt(input.inputTokens) * BigInt(inputMicroUsdPerMillionTokens) + million - BigInt(1)) / million;
    const outputCost = (BigInt(maxOutputTokens) * BigInt(outputMicroUsdPerMillionTokens) + million - BigInt(1)) / million;
    const cost = inputCost + outputCost;
    if (cost > BigInt(maxReservedMicroUsd - reservedMicroUsd)) return { status: "rejected", reason: "budget" };

    const reservation: DialogueReservation = Object.freeze({
      requestId: input.requestId, inputTokens: input.inputTokens,
      maxOutputTokens, reservedMicroUsd: Number(cost),
    });
    // 외부 호출 전에 동기적으로 예약합니다. 실패·취소·시간 초과에도 비용을 환급하지 않습니다.
    reservations.set(input.requestId, { fingerprint: input.fingerprint, reservation });
    reservedMicroUsd += reservation.reservedMicroUsd;
    return { status: "reserved", duplicate: false, reservation };
  }

  function snapshot() {
    return Object.freeze({
      requests: reservations.size, reservedMicroUsd,
      remainingMicroUsd: maxReservedMicroUsd - reservedMicroUsd,
    });
  }

  return { reserve, snapshot };
}
