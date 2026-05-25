import Image from "next/image";
import { GameResultSummary } from "./types";
import { roleLabels, roleImages } from "./constants";

export function ResultCard({
  fallbackLevel,
  fallbackTitle,
  onReset,
  summary,
  winner,
}: {
  fallbackLevel: number;
  fallbackTitle: string;
  onReset: () => void;
  summary: GameResultSummary | null;
  winner: string | null;
}) {
  const titleUnlocked =
    summary && summary.titleBefore !== summary.titleAfter
      ? `${summary.titleBefore} → ${summary.titleAfter}`
      : summary?.titleAfter ?? fallbackTitle;

  return (
    <div className="border border-red-500 bg-red-950/40 p-5">
      <p className="text-sm font-semibold text-red-200">🎭 게임 결과</p>
      <h2 className="mt-2 text-2xl font-bold text-white">
        {summary?.result ?? winner}
      </h2>
      <p className="mt-2 text-sm text-red-100">
        게임이 종료되었습니다. 참가자 역할을 확인한 뒤 새 게임을 시작할 수 있습니다.
      </p>

      {summary ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {summary.dailyCaseTitle && (
              <ResultStat label="🗓️ 오늘의 사건" value={summary.dailyCaseTitle} />
            )}
            <ResultStat label="🃏 내 역할" value={roleLabels[summary.role]} />
            <ResultStat
              label="🏁 팀 결과"
              value={`${summary.team} · ${
                summary.result.startsWith(summary.team) ? "승리" : "패배"
              }`}
            />
            <ResultStat label="💰 획득 XP" value={`+${summary.xpGained} XP`} />
            {summary.dailyCaseTitle && (
              <ResultStat
                label="🎁 데일리 보상"
                value={
                  summary.dailyRewardClaimed
                    ? `+${summary.dailyRewardXp} XP`
                    : "오늘 이미 수령"
                }
              />
            )}
            <ResultStat
              label="⭐ 레벨"
              value={`Lv. ${summary.levelBefore} → Lv. ${summary.levelAfter}`}
            />
            <ResultStat label="🏷️ 칭호" value={titleUnlocked} />
            <ResultStat label="🫀 생존" value={summary.survived ? "생존" : "탈락"} />
            <ResultStat label="🕵️ 마피아 검거" value={`${summary.mafiaCaughtCount}명`} />
            <ResultStat label="⌛ 총 라운드" value={`${summary.totalRounds}R`} />
          </div>

          <div className="mt-4 border border-red-900 bg-neutral-950/70 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-white">
                Lv. {summary.levelAfter} 진행도
              </span>
              <span className="text-neutral-400">{summary.levelProgress}/100 XP</span>
            </div>
            <div className="mt-2 h-2 bg-neutral-800">
              <div
                className="h-full bg-red-500"
                style={{ width: `${summary.levelProgress}%` }}
              />
            </div>
          </div>

          {summary.keyEvents.length > 0 && (
            <div className="mt-4 border border-neutral-800 bg-neutral-950/70 p-4">
              <h3 className="text-sm font-semibold text-white">📌 주요 사건</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-neutral-300">
                {summary.keyEvents.map((event) => (
                  <li key={event}>• {event}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.voteRecords && Object.keys(summary.voteRecords).length > 0 && (
            <div className="mt-4 border border-neutral-800 bg-neutral-950/70 p-4">
              <h3 className="text-sm font-semibold text-white">🗳️ 투표 요약</h3>
              <div className="mt-4 space-y-4">
                {Object.entries(summary.voteRecords).map(([targetName, voters]) => {
                  const target = summary.finalPlayers?.find((p) => p.name === targetName);
                  return (
                    <div key={targetName} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-red-500/50 bg-neutral-900">
                          {target && (
                            <Image
                              alt={target.role}
                              className="object-cover"
                              fill
                              src={roleImages[target.role]}
                            />
                          )}
                        </div>
                        <span className="text-sm font-bold text-red-200">
                          {targetName}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          ({target ? roleLabels[target.role] : "???"})
                        </span>
                        <span className="ml-auto text-xs font-semibold text-red-500">
                          {voters.length}표
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 pl-10">
                        {voters.map((voterName) => {
                          const voter = summary.finalPlayers?.find(
                            (p) => p.name === voterName,
                          );
                          return (
                            <div
                              key={voterName}
                              className="flex items-center gap-1 rounded-sm bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300"
                            >
                              {voter && (
                                <div className="relative h-3 w-3 overflow-hidden rounded-full border border-neutral-600">
                                  <Image
                                    alt={voter.role}
                                    className="object-cover"
                                    fill
                                    src={roleImages[voter.role]}
                                  />
                                </div>
                              )}
                              <span>{voterName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 grid gap-2 border border-red-900 bg-neutral-950/70 p-4 text-sm text-neutral-200">
          <p>⭐ 현재 레벨: Lv. {fallbackLevel}</p>
          <p>🏷️ 칭호: {fallbackTitle}</p>
        </div>
      )}

      <button
        className="mt-4 bg-white px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-red-100"
        onClick={onReset}
        type="button"
      >
        새 게임
      </button>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-red-900 bg-neutral-950/70 p-3 text-sm">
      <p className="text-neutral-400">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
