"use client";

import { Panel } from "../Common";
import { ChatResponsePreview } from "../ChatResponsePreview";
import { Difficulty, DailyCase } from "../types";

export function SetupPanel({ 
  myName, 
  setMyName, 
  playerCount, 
  setPlayerCount, 
  setupDifficulty, 
  setSetupDifficulty, 
  startGame, 
  todayKey, 
  dailyRewardAvailable, 
  dailyCase 
}: { 
  myName: string; 
  setMyName: (v: string) => void; 
  playerCount: number; 
  setPlayerCount: (v: number) => void; 
  setupDifficulty: Difficulty; 
  setSetupDifficulty: (v: Difficulty) => void; 
  startGame: (mode: "normal" | "daily", difficulty?: Difficulty) => void; 
  todayKey: string; 
  dailyRewardAvailable: boolean; 
  dailyCase: DailyCase; 
}) {
  return (
    <>
      <Panel title="새 게임">
        <div className="grid gap-6 sm:grid-cols-3">
          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-neutral-300">내 이름</span>
            <input 
              aria-label="내 이름 입력"
              className="border border-neutral-800 bg-neutral-950 p-4 text-white outline-none focus:border-red-500 transition-colors" 
              onChange={(e) => setMyName(e.target.value)} 
              placeholder="당신의 닉네임"
              value={myName} 
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-neutral-300">전체 인원</span>
            <div className="grid grid-cols-5 gap-1">
              {[4, 5, 6, 7, 8].map((count) => (
                <button
                  aria-pressed={playerCount === count}
                  className={`h-12 border text-xs font-bold transition-all ${
                    playerCount === count 
                      ? "border-red-500 bg-red-950/30 text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                      : "border-neutral-800 bg-neutral-950 text-neutral-500 hover:border-neutral-700"
                  }`}
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-neutral-300">난이도</span>
            <select 
              aria-label="난이도 선택"
              className="border border-neutral-800 bg-neutral-950 p-4 text-white outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer" 
              onChange={(e) => setSetupDifficulty(e.target.value as Difficulty)} 
              value={setupDifficulty}
            >
              <option value="easy">쉬움 (추리 난이도 낮음)</option>
              <option value="normal">보통 (표준 밸런스)</option>
              <option value="hard">어려움 (베테랑용)</option>
            </select>
          </label>
        </div>
        <button 
          className="mt-8 w-full bg-red-600 px-5 py-4 text-base font-black text-white hover:bg-red-500 shadow-xl shadow-red-950/20 active:translate-y-0.5 transition-all" 
          onClick={() => startGame("normal", setupDifficulty)} 
          type="button"
        >
          역할 배정 및 게임 시작
        </button>
      </Panel>

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

      <ChatResponsePreview />
    </>
  );
}
