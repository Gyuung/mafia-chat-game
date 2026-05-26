"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useMafiaGame } from "./useMafiaGame";
import { ResultCard } from "./ResultCard";
import { ChatResponsePreview } from "./ChatResponsePreview";
import { GameLog } from "./GameLog";
import { Panel, StatusItem } from "./Common";
import { roleLabels, roleDescriptions, roleImages, personalityTraits, getTitle } from "./constants";
import { Player, Role, Phase, Difficulty, PlayHistoryEntry } from "./types";
import { LogViewer } from "./LogViewer";

export function MafiaGame() {
  const {
    phase, round, myName, setMyName, playerCount, setPlayerCount, players, alivePlayers,
    visibleTargets, messages, chatText, setChatText, questionTargetId, setQuestionTargetId,
    nightTargetId, setNightTargetId, voteTargetId, setVoteTargetId, winner,
    gameResultSummary, profile, todayKey, dailyCase, dailyRewardAvailable,
    me, level, currentLevelXp, lastEvent, resetEvent,
    submitDialogueFeedback,
    startGame, submitChat, interrogateTarget, resolveNight, startVote, resolveVote, resetGame
  } = useMafiaGame();

  const [setupDifficulty, setSetupDifficulty] = useState<Difficulty>("normal");
  const [showOverlay, setShowOverlay] = useState(false);
  const [isEliminating, setIsEliminating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<PlayHistoryEntry | null>(null);

  useEffect(() => {
    if (phase !== "setup") {
      requestAnimationFrame(() => setShowOverlay(true));
      const timer = setTimeout(() => setShowOverlay(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (lastEvent === "elimination") {
      requestAnimationFrame(() => setIsEliminating(true));
      const timer = setTimeout(() => {
        setIsEliminating(false);
        resetEvent();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent, resetEvent]);

  // 페이즈 변경 시 사이드바 닫기
  useEffect(() => {
    requestAnimationFrame(() => setIsSidebarOpen(false));
  }, [phase]);

  const overlayText = getPhaseLabel(phase);

  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3001";

  return (
    <section className={`mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 text-neutral-100 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8 ${isEliminating ? "animate-shake" : ""}`}>
      {isEliminating && (
        <div className="animate-blood-splatter fixed inset-0 z-[60] pointer-events-none bg-red-900/20 mix-blend-multiply" />
      )}
      
      {/* 모바일 상단 바 */}
      <div className="flex items-center justify-between border border-neutral-800 bg-neutral-900 p-4 lg:hidden">
        <h1 className="text-xl font-bold text-white">Mafia Game</h1>
        <div className="flex items-center gap-3">
          <span className="bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-tighter">
            {phase === "setup" ? "Standby" : `${round}R ${overlayText}`}
          </span>
          <button 
            className="text-neutral-400 hover:text-white"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            type="button"
          >
            {isSidebarOpen ? "✕ 닫기" : "☰ 메뉴"}
          </button>
        </div>
      </div>

      {showOverlay && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500">
          <div className={`flex flex-col items-center p-8 sm:p-12 ${phase === "night" ? "animate-pulse-red border border-red-500/30 bg-red-950/20" : ""}`}>
            <p className="text-[10px] font-bold tracking-[0.3em] text-red-500 underline underline-offset-8 sm:text-sm">PHASE TRANSITION</p>
            <h2 className="mt-8 text-5xl font-black text-white tracking-widest sm:text-9xl uppercase">
              {overlayText}
            </h2>
            <p className="mt-6 text-sm font-medium text-neutral-300 sm:text-xl">
              {round}라운드 {overlayText === "밤" ? "비밀스러운 행동의 시간" : "진실을 밝히는 토론의 시간"}
            </p>
          </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-80 transform border-r border-neutral-800 bg-neutral-950 p-4 transition-transform duration-300 lg:static lg:z-0 lg:w-auto lg:translate-x-0 lg:border-none lg:bg-transparent lg:p-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="grid gap-4 self-start lg:sticky lg:top-5">
          <div className="border border-neutral-800 bg-neutral-950 p-4 hidden lg:block">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-red-300">SOLO PARTY GAME</p>
              <a className="text-xs text-neutral-400 hover:text-white" href={docsUrl} rel="noreferrer" target="_blank">Docs</a>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-white">Mafia Chat Game</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              나 혼자 접속해서 가상 참가자들과 진행하는 마피아 게임입니다. 내 역할만 확인하고, 다른 참가자의 역할은 게임 종료 후 공개됩니다.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="text-lg font-semibold">내 역할</h2>
            {me ? (
              <div className="mt-3 border border-red-900 bg-red-950/30 p-3">
                <div className="relative aspect-square overflow-hidden border border-neutral-800 bg-neutral-950">
                  <Image alt={`${roleLabels[me.role]} 역할 이미지`} className="object-cover" fill priority sizes="288px" src={roleImages[me.role]} />
                </div>
                <p className="text-2xl font-bold text-white">{roleLabels[me.role]}</p>
                <p className="mt-2 text-sm leading-6 text-red-100">{roleDescriptions[me.role]}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-400">게임을 시작하면 표시됩니다.</p>
            )}
          </div>

          <div className="border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">게임 상태</h2>
              <span className="bg-red-500 px-2 py-1 text-xs font-bold text-white">
                {phase === "setup" ? "대기" : `${round}R`}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <StatusItem label="단계" value={getPhaseLabel(phase)} />
              <StatusItem label="생존" value={`${alivePlayers.length}명`} />
              <StatusItem label="결과" value={winner ?? "진행 중"} />
              <StatusItem label="인원" value={`${players.length || playerCount}명`} />
            </dl>
            <div className="mt-4 border border-neutral-800 bg-neutral-950 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-white">Lv. {level}</span>
                <span className="text-neutral-400">{currentLevelXp}/100 XP</span>
              </div>
              <div className="mt-2 h-2 bg-neutral-800">
                <div className="h-full bg-red-500" style={{ width: `${currentLevelXp}%` }} />
              </div>
              <p className="mt-2 text-xs text-neutral-500">총 {profile.xp} XP · {getTitle(level)}</p>
            </div>
          </div>

          {profile.history.length > 0 && (
            <div className="border border-neutral-800 bg-neutral-900 p-4">
              <h2 className="text-lg font-semibold">플레이 기록</h2>
              <div className="mt-3 grid gap-2">
                {profile.history.slice(0, 3).map((entry) => (
                  <div className="group border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm" key={entry.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{entry.result}</span>
                      <span className="text-xs text-red-300">+{entry.xpGained} XP</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-neutral-400">{roleLabels[entry.role]} · {entry.round}R</p>
                      {entry.messages && (
                        <button 
                          className="text-[10px] text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                          onClick={() => setViewingHistory(entry)}
                          type="button"
                        >
                          로그 보기
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {players.length > 0 && (
            <div className="border border-neutral-800 bg-neutral-900 p-4">
              <h2 className="text-lg font-semibold">참가자</h2>
              <div className="mt-3 grid gap-2">
                {players.map((player) => (
                  <div className="flex flex-col border border-neutral-800 px-3 py-2 text-sm" key={player.id}>
                    <div className="flex items-center justify-between">
                      <span className={player.alive ? "text-white" : "text-neutral-500 line-through"}>
                        {player.name}{player.human ? " (나)" : ""}
                      </span>
                      <span className="text-neutral-400">
                        {phase === "ended" || player.human ? roleLabels[player.role] : "비공개"}
                      </span>
                    </div>
                    {player.personality && (
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500">성향</span>
                        <span className="text-red-300/80">{personalityTraits[player.personality].label}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="grid gap-4">
        {phase === "setup" && (
          <Panel title="새 게임">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-neutral-200">내 이름</span>
                <input className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400" onChange={(e) => setMyName(e.target.value)} value={myName} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-neutral-200">전체 인원</span>
                <select className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400" onChange={(e) => setPlayerCount(Number(e.target.value))} value={playerCount}>
                  {[4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count}명</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-neutral-200">난이도</span>
                <select className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400" onChange={(e) => setSetupDifficulty(e.target.value as Difficulty)} value={setupDifficulty}>
                  <option value="easy">쉬움</option>
                  <option value="normal">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </label>
            </div>
            <button className="mt-5 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400" onClick={() => startGame("normal", setupDifficulty)} type="button">역할 받고 시작</button>
          </Panel>
        )}

        {phase === "setup" && (
          <Panel title="오늘의 사건">
            <div className="border border-red-900 bg-red-950/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-red-200">{todayKey}</p>
                <span className="bg-neutral-950 px-2 py-1 text-xs font-semibold text-red-200">{dailyRewardAvailable ? `첫 완료 +${dailyCase.rewardXp} XP` : "오늘 보상 수령 완료"}</span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">{dailyCase.title}</h2>
              <p className="mt-2 text-sm leading-6 text-red-100">{dailyCase.briefing}</p>
            </div>
            <button className="mt-5 bg-white px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-red-100" onClick={() => startGame("daily")} type="button">오늘의 사건 시작</button>
          </Panel>
        )}

        {phase === "setup" && (
          <Panel title="게임 가이드">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-neutral-800 bg-neutral-900/50 p-4">
                <h3 className="font-bold text-white">🕵️ 마피아를 찾는 방법</h3>
                <ul className="mt-2 space-y-2 text-xs leading-5 text-neutral-400">
                  <li>• <span className="text-red-300">심문 일관성</span>: 시민은 매번 같은 알리바이를 말하지만, 마피아는 당황해서 말을 바꿀 때가 있습니다.</li>
                  <li>• <span className="text-red-300">방어적 태도</span>: 마피아는 대화 도중 지나치게 결백을 주장하거나 불안해하는 모습을 보입니다.</li>
                  <li>• <span className="text-red-300">투표 기록</span>: 마피아는 자기 팀을 보호하기 위해 투표를 회피하거나 시민을 몰아갈 수 있습니다.</li>
                </ul>
              </div>
              <div className="border border-neutral-800 bg-neutral-900/50 p-4">
                <h3 className="font-bold text-white">💡 플레이 팁</h3>
                <ul className="mt-2 space-y-2 text-xs leading-5 text-neutral-400">
                  <li>• <span className="text-blue-300">심문하기</span>: 낮 토론 시간에 특정 대상을 반복해서 심문해 진술이 꼬이는지 확인하세요.</li>
                  <li>• <span className="text-blue-300">특수 역할 활용</span>: 경찰은 마피아를 직접 찾아낼 수 있고, 의사는 마피아의 공격을 막아낼 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </Panel>
        )}

        {phase === "setup" && <ChatResponsePreview />}

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
              <input className="h-12 border border-neutral-700 bg-neutral-950 px-4 text-sm text-white outline-none focus:border-red-400 sm:h-auto sm:py-3" disabled={!me?.alive} onChange={(e) => setChatText(e.target.value)} placeholder={me?.alive ? "채팅을 입력하세요" : "탈락자는 발언할 수 없습니다"} value={chatText} />
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

      {viewingHistory && (
        <LogViewer 
          messages={viewingHistory.messages || []} 
          onClose={() => setViewingHistory(null)} 
          players={viewingHistory.players || []} 
        />
      )}
    </section>
  );
}

function ActionSelect({ label, onChange, players, value }: { label: string; onChange: (v: string) => void; players: Player[]; value: string; }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-neutral-200">{label}</span>
      <select className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400" onChange={(e) => onChange(e.target.value)} value={value}>
        <option value="">대상 선택</option>
        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
  );
}

function getPhaseLabel(phase: Phase) {
  return { setup: "대기", night: "밤", day: "낮", vote: "투표", ended: "종료" }[phase];
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
