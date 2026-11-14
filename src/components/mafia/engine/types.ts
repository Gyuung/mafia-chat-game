import type { Phase, Player } from "../types";

export type Winner = "시민 팀 승리" | "마피아 팀 승리";

// Internal state; this is not a public client response contract.
export type GameState = {
  phase: Phase;
  round: number;
  players: readonly Player[];
  nightActions: Readonly<Record<string, string>>;
  votes: Readonly<Record<string, string>>;
  winner: Winner | null;
};

export type TargetCommand = {
  type: "night-action" | "vote" | "interrogate";
  actorId: string;
  targetId: string;
};

// Start and phase-resolution commands will be added with the transition engine.
export type GameCommand = TargetCommand;
export type ActionState = Pick<GameState, "phase" | "players">;
export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: "wrong-phase" | "invalid-actor" | "invalid-target" | "no-ability" | "self-target" | "teammate-target" };
