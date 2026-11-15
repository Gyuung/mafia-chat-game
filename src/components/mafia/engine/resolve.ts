import type { Phase, Player } from "../types";
import { getWinner, validateTargetCommand } from "./rules";
import type { GameState, TargetCommand, ValidationResult, Winner } from "./types";

type StepState = Pick<GameState, "phase" | "round" | "players">;
export type RuleEvent =
  | { type: "investigation"; actorId: string; targetId: string; isMafia: boolean }
  | { type: "elimination"; targetId: string }
  | { type: "protected"; targetId: string }
  | { type: "quiet-night" | "tied-vote" | "no-votes" };
export type ResolvedStep = {
  ok: true;
  players: Player[];
  phase: Phase;
  round: number;
  winner: Winner | null;
  events: RuleEvent[];
  actionSuccessIds: string[];
  correctVoterIds: string[];
  receivedVoteIds: string[];
  // Internal IDs avoid merging people who have the same display name.
  ballots: Record<string, string[]>;
};
type Rejection = { ok: false; reason: string };
export type StepResult = ResolvedStep | Rejection;

function validateSubmissions(state: StepState, commands: readonly TargetCommand[], type: "night-action" | "vote"): ValidationResult | Rejection {
  if (state.phase !== (type === "vote" ? "vote" : "night")) return { ok: false, reason: "wrong-phase" };
  const actors = new Set<string>();
  for (const command of commands) {
    if (command.type !== type) return { ok: false, reason: "invalid-command" };
    if (actors.has(command.actorId)) return { ok: false, reason: "duplicate-actor" };
    const validation = validateTargetCommand(state, command);
    if (!validation.ok) return validation;
    actors.add(command.actorId);
  }
  return { ok: true };
}

function finish(state: StepState, players: Player[], nextPhase: "day" | "night", events: RuleEvent[]): ResolvedStep {
  const winner = getWinner(players);
  return {
    ok: true, players, phase: winner ? "ended" : nextPhase,
    round: state.round + (!winner && nextPhase === "night" ? 1 : 0), winner, events,
    actionSuccessIds: [], correctVoterIds: [], receivedVoteIds: [], ballots: {},
  };
}

// Decisions and randomness belong to callers. Resolution has no external effects.
export function resolveNightStep(state: StepState, commands: readonly TargetCommand[]): StepResult {
  const validation = validateSubmissions(state, commands, "night-action");
  if (!validation.ok) return validation;
  const byId = new Map(state.players.map((player) => [player.id, player]));
  const attacks = commands.filter((command) => byId.get(command.actorId)?.role === "mafia");
  if (new Set(attacks.map((command) => command.targetId)).size > 1) {
    return { ok: false, reason: "conflicting-attacks" };
  }
  const attack = attacks[0]?.targetId;
  const protections = commands.filter((command) => byId.get(command.actorId)?.role === "doctor");
  const blocked = attack !== undefined && protections.some((command) => command.targetId === attack);
  const events: RuleEvent[] = [];
  const successes: string[] = [];
  for (const command of commands) {
    if (byId.get(command.actorId)?.role === "detective") {
      const isMafia = byId.get(command.targetId)?.role === "mafia";
      events.push({ type: "investigation", actorId: command.actorId, targetId: command.targetId, isMafia });
      if (isMafia) successes.push(command.actorId);
    }
  }
  const eliminatedId = attack && !blocked ? attack : undefined;
  if (eliminatedId) {
    events.push({ type: "elimination", targetId: eliminatedId });
    successes.push(...attacks.map((command) => command.actorId));
  } else if (blocked && attack) {
    events.push({ type: "protected", targetId: attack });
    successes.push(...protections.filter((command) => command.targetId === attack).map((command) => command.actorId));
  } else {
    events.push({ type: "quiet-night" });
  }
  const players = state.players.map((player) => player.id === eliminatedId ? { ...player, alive: false } : { ...player });
  return { ...finish(state, players, "day", events), actionSuccessIds: [...new Set(successes)] };
}

export function resolveVoteStep(state: StepState, commands: readonly TargetCommand[]): StepResult {
  const validation = validateSubmissions(state, commands, "vote");
  if (!validation.ok) return validation;
  const ballots = new Map<string, string[]>();
  for (const command of commands) {
    ballots.set(command.targetId, [...(ballots.get(command.targetId) ?? []), command.actorId]);
  }
  const sorted = [...ballots.entries()].sort(([, left], [, right]) => right.length - left.length);
  const tied = sorted.length > 1 && sorted[0][1].length === sorted[1][1].length;
  const eliminatedId = !tied ? sorted[0]?.[0] : undefined;
  const votesByActor = new Map(commands.map((command) => [command.actorId, command.targetId]));
  const players = state.players.map((player) => {
    const trust = { ...player.trust };
    for (const voterId of ballots.get(player.id) ?? []) trust[voterId] = (trust[voterId] ?? 0) - 2;
    const targetId = votesByActor.get(player.id);
    for (const voterId of (targetId ? ballots.get(targetId) : undefined) ?? []) {
      if (voterId !== player.id) trust[voterId] = (trust[voterId] ?? 0) + 1;
    }
    return { ...player, alive: player.id === eliminatedId ? false : player.alive, trust };
  });
  const events: RuleEvent[] = eliminatedId ? [{ type: "elimination", targetId: eliminatedId }]
    : [{ type: tied ? "tied-vote" : "no-votes" }];
  const byId = new Map(state.players.map((player) => [player.id, player]));
  return {
    ...finish(state, players, "night", events),
    ballots: Object.fromEntries(ballots), receivedVoteIds: [...ballots.keys()],
    correctVoterIds: commands.filter((command) => byId.get(command.targetId)?.role === "mafia").map((command) => command.actorId),
  };
}
