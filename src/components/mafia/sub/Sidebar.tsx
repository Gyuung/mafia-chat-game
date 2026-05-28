"use client";

import Image from "next/image";
import { StatusItem } from "../Common";
import { roleLabels, roleDescriptions, roleImages, personalityTraits } from "../constants";
import { Player, Phase, PlayHistoryEntry, SavedProfile } from "../types";

export function Sidebar({ 
  isSidebarOpen, 
  docsUrl, 
  me, 
  myName, 
  phase, 
  round, 
  alivePlayers, 
  winner, 
  players, 
  playerCount, 
  level, 
  currentLevelXp, 
  profile, 
  setShowStats, 
  setViewingHistory 
}: { 
  isSidebarOpen: boolean; 
  docsUrl: string; 
  me: Player | null; 
  myName: string; 
  phase: Phase; 
  round: number; 
  alivePlayers: Player[]; 
  winner: string | null; 
  players: Player[]; 
  playerCount: number; 
  level: number; 
  currentLevelXp: number; 
  profile: SavedProfile; 
  setShowStats: (v: boolean) => void; 
  setViewingHistory: (v: PlayHistoryEntry | null) => void; 
}) {
  return (
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
          <p className="text-xs text-neutral-400 mt-1">{me?.name || myName || "나"} {me && "(나)"}</p>
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
            <StatusItem label="단계" value={phase === "setup" ? "대기" : phase} />
            <StatusItem label="생존" value={`${alivePlayers.length}명`} />
            <StatusItem label="결과" value={winner ?? "진행 중"} />
            <StatusItem label="인원" value={`${players.length || playerCount}명`} />
          </dl>
          <div className="mt-4 border border-neutral-800 bg-neutral-950 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Lv. {level} 경험치</span>
              <span className="text-neutral-200">{currentLevelXp}/100</span>
            </div>
            <div className="mt-2 h-2 bg-neutral-800">
              <div className="h-full bg-red-500" style={{ width: `${currentLevelXp}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-neutral-500">총 {profile.xp} XP</p>
              <button 
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-tighter underline underline-offset-2"
                onClick={() => setShowStats(true)}
                type="button"
              >
                상세 통계 보기
              </button>
            </div>
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
  );
}
