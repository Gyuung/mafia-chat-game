import type { DialogueProvider, ProviderInput } from "../../src/components/mafia/dialogue/types";

// 테스트에서만 응답을 제어하는 공급자이며, API 키·네트워크·실제 화면 설정을 사용하지 않습니다.
export function fakeDialogueProvider(reply: (input: ProviderInput, signal: AbortSignal) => Promise<unknown>) {
  const calls: { input: ProviderInput; signal: AbortSignal }[] = [];
  const provider: DialogueProvider = {
    generate(input, { signal }) {
      calls.push({ input, signal });
      return reply(input, signal);
    },
  };
  return { provider, calls };
}
