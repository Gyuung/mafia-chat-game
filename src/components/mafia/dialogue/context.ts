import type { GameState } from "../engine/types";
import type { InternalMessage } from "../engine/view";
import { validateTargetCommand } from "../engine/rules";
import type { DialogueContext } from "./types";

export const MAX_PUBLIC_MESSAGES = 12;
export const MAX_MESSAGE_CHARS = 400;

// This is an internal, trusted-state boundary. Authentication belongs to the server adapter.
export function buildDialogueContext(
  state: GameState,
  messages: readonly InternalMessage[],
  input: { gameId: string; speakerId: string; kind: DialogueContext["kind"]; question?: { actorId: string; text: string } },
): DialogueContext | null {
  if (state.phase !== "day" && state.phase !== "vote") return null;
  if (!input.gameId.trim() || input.gameId.length > 128 || state.players.length > 8) return null;
  const speaker = state.players.find((p) => p.id === input.speakerId);
  if (!speaker?.alive || speaker.human) return null;
  if (input.kind === "interrogation") {
    if (!input.question?.text.trim() || input.question.text.length > MAX_MESSAGE_CHARS) return null;
    if (!validateTargetCommand(state, { type: "interrogate", actorId: input.question.actorId, targetId: speaker.id }).ok) return null;
  }
  return {
    gameId: input.gameId, round: state.round, phase: state.phase, kind: input.kind,
    speaker: {
      id: speaker.id, name: speaker.name.slice(0, 40), role: speaker.role,
      ...(speaker.personality ? { personality: speaker.personality } : {}),
    },
    participants: state.players.map((p) => ({ id: p.id, name: p.name.slice(0, 40), alive: p.alive })),
    // Even the NPC's own private investigation/role notices are excluded from model input.
    publicMessages: messages.filter((m) => m.audience?.type === "public").slice(-MAX_PUBLIC_MESSAGES)
      .map((m) => ({ sender: m.sender.slice(0, 40), text: m.text.slice(0, MAX_MESSAGE_CHARS), ...(m.system !== undefined ? { system: m.system } : {}) })),
    ...(input.kind === "interrogation" && input.question ? {
      question: { actorId: input.question.actorId, text: input.question.text },
    } : {}),
  };
}
