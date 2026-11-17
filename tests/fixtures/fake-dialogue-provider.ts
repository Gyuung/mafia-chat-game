import type { DialogueProvider, ProviderInput } from "../../src/components/mafia/dialogue/types";

// Test-only scripted provider. No API keys, network or production UI setting.
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
