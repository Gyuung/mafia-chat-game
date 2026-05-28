"use client";

import { Panel } from "../Common";
import { ActionSelect } from "./ActionSelect";
import { ResultCard } from "../ResultCard";
import { GameLog } from "../GameLog";
import { Player, Phase, Role, PlayHistoryEntry, GameResultSummary } from "../types";
import { getTitle } from "../constants";

export function GameMain({ 
  phase, 
  me, 
  visibleTargets, 
  nightTargetId, 
  setNightTargetId, 
  resolveNight, 
  questionTargetId, 
  setQuestionTargetId, 
  interrogateTarget, 
  submitChat, 
  chatText, 
  setChatText, 
  startVote, 
  voteTargetId, 
  setVoteTargetId, 
  resolveVote, 
  resetGame, 
  winner, 
  gameResultSummary, 
  level, 
  round, 
  messages, 
  players, 
  submitDialogueFeedback, 
  setViewingHistory 
}: { 
  phase: Phase; 
  me: Player | null; 
  visibleTargets: Player[]; 
  nightTargetId: string; 
  setNightTargetId: (v: string) => void; 
  resolveNight: () => void; 
  questionTargetId: string; 
  setQuestionTargetId: (v: string) => void; 
  interrogateTarget: () => void; 
  submitChat: (e: any) => void; 
  chatText: string; 
  setChatText: (v: string) => void; 
  startVote: () => void; 
  voteTargetId: string; 
  setVoteTargetId: (v: string) => void; 
  resolveVote: () => void; 
  resetGame: () => void; 
  winner: string | null; 
  gameResultSummary: GameResultSummary | null; 
  level: number; 
  round: number; 
  messages: any[]; 
  players: Player[]; 
  submitDialogueFeedback: any; 
  setViewingHistory: (v: PlayHistoryEntry | null) => void; 
}) {
  return (
    <main className="grid gap-4">
      {phase === "night" && me && (
        <Panel title="밤 행동">
          {me.role === "citizen" ? (
            <p className="text-sm text-neutral-400">시민은 밤 행동이 없습니다. 밤 결과를 진행하세요.</p>
          ) : (
            <ActionSelect label={getNightActionLabel(me.role)} onChange={setNightTargetId} players={getNightTargets(me, visibleTargets)} value={nightTargetId} />
          )}
          <button className="mt-5 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:bg-neutral-700" disabled={me.role !== "citizen" && !nightTargetId} onClick={resolveNight} type="button">밤 결과 보기</button>
        </Panel>
      )}

      {(phase === "day" || phase === "vote") && (
        <Panel title="낮 토론">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <ActionSelect label="심문할 참가자" onChange={setQuestionTargetId} players={visibleTargets} value={questionTargetId} />
            <button className="h-12 self-end bg-red-500 px-8 text-sm font-bold text-white hover:bg-red-400 disabled:bg-neutral-700 sm:h-auto sm:py-3" disabled={!me?.alive || !questionTargetId} onClick={interrogateTarget} type="button">심문하기</button>
          </div>
          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submitChat}>
            <input 
              aria-label="채팅 입력"
              className="h-12 border border-neutral-700 bg-neutral-950 px-4 text-sm text-white outline-none focus:border-red-400 sm:h-auto sm:py-3" 
              disabled={!me?.alive} 
              onChange={(e) => setChatText(e.target.value)} 
              placeholder={me?.alive ? "채팅을 입력하세요" : "탈락자는 발언할 수 없습니다"} 
              value={chatText} 
            />
            <button className="h-12 bg-neutral-100 px-8 text-sm font-bold text-neutral-950 hover:bg-white disabled:bg-neutral-700 disabled:text-neutral-400 sm:h-auto sm:py-3" disabled={!me?.alive} type="submit">전송</button>
          </form>
          {phase === "day" && <button className="mt-4 w-full bg-red-500 py-4 text-sm font-bold text-white hover:bg-red-400 sm:w-auto sm:px-5 sm:py-3" onClick={startVote} type="button">투표로 넘어가기</button>}
        </Panel>
      )}

      {phase === "vote" && (
        <Panel title="투표">
          {me?.alive ? <ActionSelect label="의심 대상" onChange={setVoteTargetId} players={visibleTargets} value={voteTargetId} /> : <p className="text-sm text-neutral-400">탈락자는 투표할 수 없습니다.</p>}
          <button className="mt-5 w-full bg-red-500 py-4 text-sm font-bold text-white hover:bg-red-400 disabled:bg-neutral-700 sm:w-auto sm:px-5 sm:py-3" disabled={!!me?.alive && !voteTargetId} onClick={resolveVote} type="button">투표 결과 보기</button>
        </Panel>
      )}

      {phase === "ended" && (
        <ResultCard 
          fallbackLevel={level} 
          fallbackTitle={getTitle(level)} 
          onReset={resetGame} 
          onViewLog={() => setViewingHistory({ 
            id: "current", endedAt: new Date().toISOString(), result: winner || "", role: me?.role || "citizen", 
            round, survived: me?.alive || false, xpGained: 0, levelAfter: level, titleAfter: getTitle(level),
            messages, players
          })}
          summary={gameResultSummary} 
          winner={winner} 
        />
      )}

      <GameLog messages={messages} players={players} submitDialogueFeedback={submitDialogueFeedback} />
    </main>
  );
}

function getNightActionLabel(role: Role) {
  if (role === "mafia") return "제거 대상";
  if (role === "doctor") return "보호 대상";
  if (role === "detective") return "조사 대상";
  return "대상";
}

function getNightTargets(me: Player, targets: Player[]) {
  if (me.role === "mafia") return targets.filter(p => p.role !== "mafia");
  if (me.role === "detective") return targets;
  return [me, ...targets].filter(p => p.alive);
}
