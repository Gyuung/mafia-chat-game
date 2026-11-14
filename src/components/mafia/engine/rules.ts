import type { Player, Role } from "../types";
import type { ActionState, TargetCommand, ValidationResult, Winner } from "./types";

export function createRoleDeck(playerCount: number): Role[] {
  if (!Number.isInteger(playerCount) || playerCount < 4 || playerCount > 8) {
    throw new RangeError("참가자는 4~8명이어야 합니다.");
  }
  const roles: Role[] = Array<Role>(Math.max(1, Math.floor(playerCount / 4))).fill("mafia");
  if (playerCount >= 5) roles.push("doctor");
  if (playerCount >= 6) roles.push("detective");
  while (roles.length < playerCount) roles.push("citizen");
  return roles;
}

export function getWinner(players: readonly Player[]): Winner | null {
  const alive = players.filter((player) => player.alive);
  if (alive.length === 0) return null;
  const mafiaCount = alive.filter((player) => player.role === "mafia").length;
  if (mafiaCount === 0) return "시민 팀 승리";
  if (mafiaCount >= alive.length - mafiaCount) return "마피아 팀 승리";
  return null;
}

export function validateTargetCommand(state: ActionState, command: TargetCommand): ValidationResult {
  const inPhase = command.type === "night-action" ? state.phase === "night"
    : command.type === "vote" ? state.phase === "vote"
    : state.phase === "day" || state.phase === "vote";
  if (!inPhase) return { ok: false, reason: "wrong-phase" };
  const actor = state.players.find((player) => player.id === command.actorId);
  if (!actor?.alive) return { ok: false, reason: "invalid-actor" };
  const target = state.players.find((player) => player.id === command.targetId);
  if (!target?.alive) return { ok: false, reason: "invalid-target" };
  if (command.type === "night-action" && actor.role === "citizen") {
    return { ok: false, reason: "no-ability" };
  }
  if (actor.id === target.id && !(command.type === "night-action" && actor.role === "doctor")) {
    return { ok: false, reason: "self-target" };
  }
  if (command.type === "night-action" && actor.role === "mafia" && target.role === "mafia") {
    return { ok: false, reason: "teammate-target" };
  }
  return { ok: true };
}

export function getActionTargets(state: ActionState, actorId: string, type: TargetCommand["type"]) {
  return state.players.filter((target) => validateTargetCommand(state, { type, actorId, targetId: target.id }).ok);
}
