import { PlayHistoryEntry, Role, SavedAchievement } from "./types";
import { roleLabels, ACHIEVEMENTS } from "./constants";

export function CareerStats({ 
  history,
  achievements = [],
  onClose 
}: { 
  history: PlayHistoryEntry[];
  achievements?: SavedAchievement[];
  onClose: () => void;
}) {
  const totalGames = history.length;
  const wins = history.filter(h => h.result.includes("승리")).length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  
  const roleStats = history.reduce((acc, h) => {
    acc[h.role] = (acc[h.role] || 0) + 1;
    return acc;
  }, {} as Record<Role, number>);

  const survivedCount = history.filter(h => h.survived).length;
  const avgRounds = totalGames > 0 
    ? (history.reduce((sum, h) => sum + h.round, 0) / totalGames).toFixed(1) 
    : 0;

  const unlockedIds = new Set(achievements.map(a => a.id));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col border border-neutral-800 bg-neutral-950 shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-neutral-800 p-5 shrink-0">
          <h2 className="text-xl font-bold text-white tracking-tight">수사 경력 통계</h2>
          <button className="text-neutral-500 hover:text-white" onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8">
          {totalGames === 0 ? (
            <div className="py-10 text-center">
              <p className="text-neutral-500">아직 플레이 기록이 없습니다.</p>
              <p className="mt-2 text-xs text-neutral-600">게임을 완료하면 통계가 집계됩니다.</p>
            </div>
          ) : (
            <>
              {/* 요약 카드 */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="총 플레이" value={`${totalGames}회`} />
                <StatCard color="text-red-500" label="승률" value={`${winRate}%`} />
                <StatCard label="생존 횟수" value={`${survivedCount}회`} />
                <StatCard label="평균 버틴 라운드" value={`${avgRounds}R`} />
              </div>

              {/* 업적 섹션 */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">달성한 업적</h3>
                  <span className="text-[10px] font-mono text-neutral-600">{unlockedIds.size} / {ACHIEVEMENTS.length}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ACHIEVEMENTS.map(ach => {
                    const isUnlocked = unlockedIds.has(ach.id);
                    return (
                      <div 
                        className={`group relative flex aspect-square flex-col items-center justify-center border transition-all ${isUnlocked ? "border-red-900/50 bg-red-950/20" : "border-neutral-800 bg-neutral-900/30 grayscale opacity-40"}`} 
                        key={ach.id}
                        title={`${ach.title}: ${ach.description}`}
                      >
                        <span className="text-2xl">{ach.icon}</span>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 mb-2 hidden w-40 -translate-x-1/2 border border-neutral-800 bg-neutral-950 p-2 text-center group-hover:block z-10 shadow-2xl">
                          <p className="text-xs font-bold text-white">{ach.title}</p>
                          <p className="mt-1 text-[10px] text-neutral-400 leading-tight">{ach.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 역할 분포 */}
              <section>
                <h3 className="mb-3 text-xs font-bold text-neutral-500 uppercase tracking-widest">역할별 수행 횟수</h3>
                <div className="grid gap-2">
                  {(["mafia", "detective", "doctor", "citizen"] as Role[]).map(role => (
                    <div className="group relative h-10 border border-neutral-800 bg-neutral-900/50 overflow-hidden" key={role}>
                      <div 
                        className="absolute inset-y-0 left-0 bg-red-900/20 transition-all duration-1000" 
                        style={{ width: `${(roleStats[role] || 0) / totalGames * 100}%` }} 
                      />
                      <div className="relative flex h-full items-center justify-between px-4 text-sm">
                        <span className="font-medium text-neutral-300">{roleLabels[role]}</span>
                        <span className="font-bold text-white">{roleStats[role] || 0}회</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 등급 안내 */}
              <div className="border border-red-900/30 bg-red-950/10 p-4 text-center">
                <p className="text-[10px] text-red-400 font-bold uppercase">Detective Grade</p>
                <p className="mt-1 text-sm text-neutral-300">
                  {totalGames >= 50 ? "전설적인 마피아 헌터" : 
                   totalGames >= 20 ? "베테랑 수사관" : 
                   totalGames >= 5 ? "능숙한 탐정" : "수습 요원"}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-neutral-800 p-4 shrink-0">
          <button 
            className="w-full bg-neutral-100 py-3 text-sm font-bold text-neutral-950 hover:bg-white"
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="border border-neutral-800 bg-neutral-900/30 p-4">
      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">{label}</p>
      <p className={`mt-1 text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="size-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
