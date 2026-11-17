import type { Phase, Player } from "../types";

export type Winner = "시민 팀 승리" | "마피아 팀 승리";

// 엔진 내부 상태이며, 클라이언트에 공개하는 응답 형식이 아닙니다.
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

// 대상 제출 형식은 공통으로 사용하고, 일괄 판정은 resolveNightStep/resolveVoteStep이 담당합니다.
// 통신 계층의 시작·진행 명령은 추후 서버 어댑터에서 정의합니다.
export type GameCommand = TargetCommand;
export type ActionState = Pick<GameState, "phase" | "players">;
export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: "wrong-phase" | "invalid-actor" | "invalid-target" | "no-ability" | "self-target" | "teammate-target" };
