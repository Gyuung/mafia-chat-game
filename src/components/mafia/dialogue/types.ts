import type { PersonalityType, Role } from "../types";

export type DialogueContext = {
  gameId: string;
  round: number;
  phase: "day" | "vote";
  kind: "discussion" | "interrogation";
  speaker: { id: string; name: string; role: Role; personality?: PersonalityType };
  participants: { id: string; name: string; alive: boolean }[];
  publicMessages: { sender: string; text: string; system?: boolean }[];
  question?: { actorId: string; text: string };
};

export type ProviderInput = {
  instructions: string;
  context: DialogueContext;
  maxOutputChars: number;
};
export type DialogueProvider = {
  generate(input: ProviderInput, options: { signal: AbortSignal }): Promise<unknown>;
};
export type DialogueResult =
  | { status: "ready"; source: "provider"; text: string }
  | { status: "ready"; source: "fallback"; text: string; reason: "disabled" | "provider-error" | "timeout" | "invalid-output" }
  | { status: "discarded"; reason: "invalid-request" | "conflict" | "capacity" | "cancelled" | "stale" | "disposed" };
