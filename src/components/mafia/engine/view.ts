import type { Message, Player, RevealedPlayer, VisiblePlayer } from "../types";
import type { GameState } from "./types";

export type Audience = { type: "public" } | { type: "private"; playerId: string };
export type InternalMessage = Message & { audience: Audience };
export type ViewerState = {
  phase: GameState["phase"];
  round: number;
  winner: GameState["winner"];
  players: VisiblePlayer[];
  self: RevealedPlayer;
  messages: Message[];
  nightTargetId?: string;
  voteTargetId?: string;
};

function publicPlayer(player: Player): Omit<VisiblePlayer, "role"> {
  return {
    id: player.id, name: player.name, alive: player.alive, human: player.human,
    ...(player.personality ? { personality: player.personality } : {}),
  };
}

export function revealedPlayers(state: Pick<GameState, "phase" | "players">): RevealedPlayer[] {
  if (state.phase !== "ended") return [];
  return state.players.map((player) => ({ ...publicPlayer(player), role: player.role }));
}

export function projectMessagesForViewer(players: readonly Player[], messages: readonly InternalMessage[], viewerId: string): Message[] {
  if (!players.some((player) => player.id === viewerId)) return [];
  return messages.filter((message) => message.audience?.type === "public"
    || (message.audience?.type === "private" && message.audience.playerId === viewerId))
    .map((message) => ({
      id: message.id, sender: message.sender, text: message.text,
      ...(message.system !== undefined ? { system: message.system } : {}),
      ...(message.audience.type === "private" ? { personal: true } : {}),
    }));
}

export function projectForViewer(state: GameState, viewerId: string, messages: readonly InternalMessage[] = []): ViewerState | null {
  const self = state.players.find((player) => player.id === viewerId);
  if (!self) return null;
  const ended = state.phase === "ended";
  return {
    phase: state.phase, round: state.round, winner: ended ? state.winner : null,
    players: state.players.map((player) => ({
      ...publicPlayer(player), ...(ended || player.id === viewerId ? { role: player.role } : {}),
    })),
    self: { ...publicPlayer(self), role: self.role },
    messages: projectMessagesForViewer(state.players, messages, viewerId),
    ...(state.phase === "night" && Object.hasOwn(state.nightActions, viewerId)
      ? { nightTargetId: state.nightActions[viewerId] } : {}),
    ...(state.phase === "vote" && Object.hasOwn(state.votes, viewerId)
      ? { voteTargetId: state.votes[viewerId] } : {}),
  };
}

// Visible choices must not depend on another participant's secret role.
export function visibleNightTargets(self: RevealedPlayer, players: readonly VisiblePlayer[]) {
  if (!self.alive || self.role === "citizen") return [];
  return players.filter((player) => player.alive && (self.role === "doctor" || player.id !== self.id));
}
