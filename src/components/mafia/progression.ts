import { ACHIEVEMENTS, MAX_HISTORY_ITEMS } from "./constants";
import type { GameResultSummary, PlayHistoryEntry, SavedProfile } from "./types";

export function getCaughtTotal(profile: SavedProfile) {
  return profile.mafiaCaughtTotal ?? profile.history.reduce(
    (total, entry) => total + (entry.players?.filter(
      (player) => !player.human && player.role === "mafia" && !player.alive,
    ).length ?? 0), 0,
  );
}

export function completeProfile(
  current: SavedProfile,
  summary: GameResultSummary,
  entry: PlayHistoryEntry,
) {
  const unlockedIds = new Set(current.achievements?.map((achievement) => achievement.id));
  // Conditions receive the profile before this game to avoid counting it twice.
  const before = { ...current, mafiaCaughtTotal: getCaughtTotal(current) };
  const newlyUnlocked = ACHIEVEMENTS.filter(
    (achievement) => !unlockedIds.has(achievement.id) && achievement.condition(summary, before),
  );
  const profile: SavedProfile = {
    ...current,
    xp: current.xp + summary.xpGained,
    history: [entry, ...current.history].slice(0, MAX_HISTORY_ITEMS),
    mafiaCaughtTotal: before.mafiaCaughtTotal + summary.mafiaCaughtCount,
    achievements: [
      ...(current.achievements ?? []),
      ...newlyUnlocked.map((achievement) => ({ id: achievement.id, unlockedAt: entry.endedAt })),
    ],
  };
  return { profile, newlyUnlocked };
}
