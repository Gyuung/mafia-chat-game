import { createHash } from "node:crypto";
import type { createDialogueBudget } from "../../components/mafia/dialogue/budget";
import type { DialogueContext, DialogueProvider, ProviderInput } from "../../components/mafia/dialogue/types";

export type PreparedDialogueCall = {
  inputTokens: number;
  invoke(options: { signal: AbortSignal; maxOutputTokens: number }): Promise<unknown>;
};

type Options = {
  gameId: string;
  providerKey: string;
  budget: Pick<ReturnType<typeof createDialogueBudget>, "reserve">;
  isCurrent(context: DialogueContext): boolean;
  prepare(input: ProviderInput, options: { signal: AbortSignal }): Promise<PreparedDialogueCall>;
};

// 인증·상태 검증 후 서버에서 사용합니다. prepare는 유료 생성 없이 전체 입력을 계산해야 합니다.
export function createMeteredDialogueProvider(options: Options): DialogueProvider {
  const { gameId, providerKey, prepare, isCurrent } = options;
  const reserve = options.budget.reserve;
  for (const value of [gameId, providerKey]) {
    if (!value.trim() || value.length > 128) throw new RangeError("게임과 공급자 설정 식별자가 필요합니다.");
  }

  return {
    async generate(input, { signal, requestId }) {
      signal.throwIfAborted();
      if (input.context.gameId !== gameId || !isCurrent(input.context)) throw new Error("현재 게임의 대사 요청이 아닙니다.");
      const snapshot = structuredClone(input);
      const context = structuredClone(snapshot.context);
      // 공급자·모델·직렬화·생성 설정이 바뀌면 providerKey도 바꿔야 합니다.
      const fingerprint = createHash("sha256").update(JSON.stringify({ providerKey, input: snapshot })).digest("hex");
      const prepared = await prepare(snapshot, { signal });
      // 토큰 계산이 취소 신호를 무시하고 늦게 끝나도 예약·생성으로 넘어가지 않습니다.
      signal.throwIfAborted();
      if (!isCurrent(context)) throw new Error("게임 단계가 변경되었습니다.");
      const result = reserve({ requestId, fingerprint, inputTokens: prepared.inputTokens });
      if (result.status === "rejected") throw new Error("대사 요청 예약이 거절되었습니다.");
      // 기존 응답은 조정기에서 재사용합니다. 장부만 남은 경우 재과금 대신 대체 대사를 사용합니다.
      if (result.duplicate) throw new Error("이미 예약된 대사 요청입니다.");
      return prepared.invoke({ signal, maxOutputTokens: result.reservation.maxOutputTokens });
    },
  };
}
