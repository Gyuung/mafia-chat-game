import type { Role } from "./types";

export function hasWon(role: Role, result: string) {
  const team = role === "mafia" ? "마피아 팀" : "시민 팀";
  return result === `${team} 승리`;
}
