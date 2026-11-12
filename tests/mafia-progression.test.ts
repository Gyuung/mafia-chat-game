import assert from "node:assert/strict";
import test from "node:test";
import { completeProfile } from "../src/components/mafia/progression";
import { hasWon } from "../src/components/mafia/results";
import { ACHIEVEMENTS, MAX_HISTORY_ITEMS } from "../src/components/mafia/constants";
import type { GameResultSummary, PlayHistoryEntry, Role, SavedProfile } from "../src/components/mafia/types";

const summary: GameResultSummary = {
  result: "시민 팀 승리", role: "citizen", team: "시민 팀", xpGained: 40,
  levelBefore: 1, levelAfter: 1, levelProgress: 40,
  titleBefore: "신입 탐정", titleAfter: "신입 탐정", survived: true,
  keyEvents: [], dailyRewardXp: 0, dailyRewardClaimed: false,
  mafiaCaughtCount: 0, totalRounds: 2, interrogationCount: 0,
  correctVoteCount: 0, roleActionSuccessCount: 0, receivedVote: false,
};
const entry: PlayHistoryEntry = {
  id: "game-1", endedAt: "2026-11-12T15:01:00.000Z", result: "마피아 팀 승리",
  role: "citizen", round: 2, survived: true, xpGained: 40,
  levelAfter: 1, titleAfter: "신입 탐정",
};
const losingSummary = { ...summary, result: "마피아 팀 승리", dailyCaseTitle: "오늘의 사건" };

function unlocked(stats: GameResultSummary) {
  return completeProfile({ xp: 0, history: [] }, stats, entry).newlyUnlocked.map((a) => a.id);
}

test("승률과 승리 업적은 자신의 진영 결과로 판정한다", () => {
  for (const role of ["mafia", "doctor", "detective", "citizen"] as Role[]) {
    assert.equal(hasWon(role, "마피아 팀 승리"), role === "mafia");
    assert.equal(hasWon(role, "시민 팀 승리"), role !== "mafia");
  }
  assert.deepEqual(unlocked(losingSummary), ["first_game"]);
  const wins = unlocked({ ...losingSummary, result: "시민 팀 승리" });
  assert.ok(wins.includes("first_win"));
  assert.ok(wins.includes("phoenix"));
  assert.ok(wins.includes("daily_solver"));
});

test("업적은 중복 알림 없이 유지되고 피드백과 일일 보상 날짜를 보존한다", () => {
  const current: SavedProfile = {
    xp: 10, history: [], lastDailyRewardDate: "2026-11-11",
    dialogueFeedback: [{ messageId: "m", sender: "bot", text: "대사", rating: "good", timestamp: "now" }],
  };
  const first = completeProfile(current, losingSummary, entry);
  const second = completeProfile(first.profile, losingSummary, { ...entry, id: "game-2" });
  assert.deepEqual(second.newlyUnlocked, []);
  assert.deepEqual(second.profile.achievements, [{ id: "first_game", unlockedAt: entry.endedAt }]);
  assert.deepEqual(second.profile.dialogueFeedback, current.dialogueFeedback);
  assert.equal(second.profile.lastDailyRewardDate, "2026-11-11");
  assert.equal(second.profile.xp, 90);
  assert.equal(current.history.length, 0);
});

test("누적 검거는 최근 10개 기록 삭제 이후에도 유지하며 현재 판은 한 번만 집계한다", () => {
  const current: SavedProfile = { xp: 0, history: Array.from({ length: MAX_HISTORY_ITEMS }, (_, i) => ({ ...entry, id: `old-${i}` })), mafiaCaughtTotal: 3 };
  const first = completeProfile(current, { ...losingSummary, mafiaCaughtCount: 1 }, entry);
  assert.ok(!first.newlyUnlocked.some((a) => a.id === "mafia_hunter_1"));
  const second = completeProfile(first.profile, { ...losingSummary, mafiaCaughtCount: 1 }, entry);
  assert.equal(second.profile.mafiaCaughtTotal, 5);
  assert.equal(second.profile.history.length, MAX_HISTORY_ITEMS);
  assert.ok(second.newlyUnlocked.some((a) => a.id === "mafia_hunter_1"));
});

test("기존 저장 기록의 검거 수를 초기 누적값으로 이어받는다", () => {
  const current: SavedProfile = { xp: 0, history: [{ ...entry, players: [{ id: "bot", name: "참가자", role: "mafia", alive: false, human: false, suspicion: 0, trust: {} }] }] };
  assert.equal(completeProfile(current, { ...losingSummary, mafiaCaughtCount: 1 }, entry).profile.mafiaCaughtTotal, 2);
});

test("완벽한 알리바이는 마피아 승리와 전체 게임 무득표를 모두 요구한다", () => {
  const condition = ACHIEVEMENTS.find((a) => a.id === "perfect_alibi")!.condition;
  const current: SavedProfile = { xp: 0, history: [] };
  const win = { ...summary, role: "mafia" as const, team: "마피아 팀" as const, result: "마피아 팀 승리" };
  assert.equal(condition(win, current), true);
  assert.equal(condition({ ...win, receivedVote: true }, current), false);
  assert.equal(condition({ ...win, receivedVote: undefined }, current), false);
  assert.equal(condition({ ...win, result: "시민 팀 승리" }, current), false);
});


test("종료 행동 수치로 투표·수사·방어·레벨 업적을 판정한다", () => {
  const stats = { ...summary, role: "doctor" as const, correctVoteCount: 2,
    interrogationCount: 5, roleActionSuccessCount: 1, levelAfter: 10 };
  const ids = unlocked(stats);
  for (const id of ["sharp_insight", "thorough_investigation", "miraculous_defense", "veteran_investigator"]) {
    assert.ok(ids.includes(id));
  }
  const before = unlocked({ ...stats, correctVoteCount: 1, interrogationCount: 4,
    roleActionSuccessCount: 0, levelAfter: 9 });
  for (const id of ["sharp_insight", "thorough_investigation", "miraculous_defense", "veteran_investigator"]) {
    assert.ok(!before.includes(id));
  }
});
