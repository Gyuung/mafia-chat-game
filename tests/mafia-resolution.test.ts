import assert from "node:assert/strict";
import test from "node:test";
import { resolveNightStep, resolveVoteStep } from "../src/components/mafia/engine/resolve";
import type { StepResult } from "../src/components/mafia/engine/resolve";
import type { TargetCommand } from "../src/components/mafia/engine/types";
import type { Player, Role } from "../src/components/mafia/types";

function player(id: string, role: Role, alive = true): Player {
  return { id, name: id, role, alive, human: id === "c1", suspicion: 0, trust: {} };
}
const players = [player("m", "mafia"), player("d", "doctor"), player("i", "detective"), player("c1", "citizen"), player("c2", "citizen")];
function action(actorId: string, targetId: string): TargetCommand { return { type: "night-action", actorId, targetId }; }
function vote(actorId: string, targetId: string): TargetCommand { return { type: "vote", actorId, targetId }; }
const night = { phase: "night" as const, round: 2, players };
const dayVote = { ...night, phase: "vote" as const };
function resolved(result: StepResult) {
  assert.ok(result.ok, result.ok ? undefined : result.reason);
  return result;
}

test("밤 공격과 보호·조사를 동시 판정하고 마지막 행동 기여를 반환", () => {
  const step = resolved(resolveNightStep(night, [action("m", "c1"), action("d", "c1"), action("i", "m")]));
  assert.ok(step.players.every((p) => p.alive));
  assert.equal(step.phase, "day");
  assert.equal(step.round, 2);
  assert.deepEqual(step.actionSuccessIds, ["i", "d"]);
  assert.deepEqual(step.events, [
    { type: "investigation", actorId: "i", targetId: "m", isMafia: true },
    { type: "protected", targetId: "c1" },
  ]);
});

test("의사 자기 보호와 형사의 시민 조사 결과", () => {
  const step = resolved(resolveNightStep(night, [action("m", "d"), action("d", "d"), action("i", "c1")]));
  assert.equal(step.players.find((p) => p.id === "d")?.alive, true);
  assert.deepEqual(step.actionSuccessIds, ["d"]);
  assert.deepEqual(step.events[0], { type: "investigation", actorId: "i", targetId: "c1", isMafia: false });
});

test("조사는 같은 밤 탈락해도 수행되며 공격 성공은 마피아에게만 집계", () => {
  const step = resolved(resolveNightStep(night, [action("m", "i"), action("d", "c1"), action("i", "m")]));
  assert.equal(step.players.find((p) => p.id === "i")?.alive, false);
  assert.deepEqual(step.actionSuccessIds, ["i", "m"]);
  assert.equal(step.events[1].type, "elimination");
});

test("공격 미제출은 조용한 밤이며 보호 성공으로 오인하지 않음", () => {
  const step = resolved(resolveNightStep(night, [action("d", "c1")]));
  assert.deepEqual(step.events, [{ type: "quiet-night" }]);
  assert.deepEqual(step.actionSuccessIds, []);
});

test("사망자·자기 투표·잘못된 대상·단계·종류 및 중복 제출은 전체 판정 거절", () => {
  const invalidNight = [
    [action("c1", "m")], [action("m", "m")], [action("m", "missing")],
    [vote("m", "c1")], [action("m", "c1"), action("m", "c2")],
  ];
  for (const commands of invalidNight) assert.equal(resolveNightStep(night, commands).ok, false);
  const withDead = { ...night, players: [...players, player("dead", "doctor", false)] };
  assert.equal(resolveNightStep(withDead, [action("dead", "c1")]).ok, false);
  assert.equal(resolveNightStep(withDead, [action("m", "dead")]).ok, false);
  assert.equal(resolveNightStep(dayVote, []).ok, false);
  assert.equal(resolveVoteStep(night, []).ok, false);
  for (const commands of [[vote("c1", "c1")], [vote("c1", "m"), vote("c1", "d")], [action("m", "c1")]]) {
    assert.equal(resolveVoteStep(dayVote, commands).ok, false);
  }
});

test("마피아 공격은 합의된 한 대상만 처리하며 서로 다른 대상은 거절", () => {
  const state = { ...night, players: [...players, player("m2", "mafia")] };
  assert.deepEqual(resolveNightStep(state, [action("m", "c1"), action("m2", "c2")]), { ok: false, reason: "conflicting-attacks" });
  const step = resolved(resolveNightStep(state, [action("m", "c1"), action("m2", "c1")]));
  assert.equal(step.players.filter((p) => !p.alive).length, 1);
  assert.deepEqual(step.actionSuccessIds, ["m", "m2"]);
});

test("득표·정확한 투표·공동 투표 신뢰도는 ID로 집계", () => {
  const sameNames = players.map((p) => ({ ...p, name: "동명이인" }));
  const step = resolved(resolveVoteStep({ ...dayVote, players: sameNames }, [vote("c1", "m"), vote("d", "m"), vote("i", "c2"), vote("m", "c2"), vote("c2", "m")]));
  assert.deepEqual(step.ballots, { m: ["c1", "d", "c2"], c2: ["i", "m"] });
  assert.deepEqual(step.correctVoterIds, ["c1", "d", "c2"]);
  assert.deepEqual(step.receivedVoteIds, ["m", "c2"]);
  assert.equal(step.players.find((p) => p.id === "m")?.alive, false);
  assert.deepEqual(step.players.find((p) => p.id === "m")?.trust, { c1: -2, d: -2, c2: -2, i: 1 });
  assert.deepEqual(step.players.find((p) => p.id === "c1")?.trust, { d: 1, c2: 1 });
  assert.equal(step.winner, "시민 팀 승리");
  assert.equal(step.phase, "ended");
  assert.equal(step.round, 2);
});

test("공동 최다 득표와 전원 기권에서는 탈락 없이 다음 라운드", () => {
  const tied = resolved(resolveVoteStep(dayVote, [vote("m", "c1"), vote("d", "m"), vote("i", "c1"), vote("c1", "m")]));
  assert.deepEqual(tied.events, [{ type: "tied-vote" }]);
  assert.ok(tied.players.every((p) => p.alive));
  assert.equal(tied.round, 3);
  assert.equal(tied.phase, "night");
  const empty = resolved(resolveVoteStep(dayVote, []));
  assert.deepEqual(empty.events, [{ type: "no-votes" }]);
  assert.equal(empty.round, 3);
});

test("밤 공격으로 동수가 되면 즉시 마피아 승리이며 라운드는 증가하지 않음", () => {
  const state = { ...night, players: [player("m", "mafia"), player("c1", "citizen"), player("c2", "citizen")] };
  const step = resolved(resolveNightStep(state, [action("m", "c1")]));
  assert.equal(step.winner, "마피아 팀 승리");
  assert.equal(step.phase, "ended");
  assert.equal(step.round, 2);
  assert.deepEqual(step.actionSuccessIds, ["m"]);
});

test("탈락자는 제출 없이 남은 NPC 투표로 게임 진행", () => {
  const state = { ...dayVote, players: players.map((p) => p.id === "c1" ? { ...p, alive: false } : p) };
  const step = resolved(resolveVoteStep(state, [vote("d", "m"), vote("i", "m"), vote("m", "d"), vote("c2", "m")]));
  assert.equal(step.winner, "시민 팀 승리");
  assert.ok(!step.correctVoterIds.includes("c1"));
  assert.ok(!Object.values(step.ballots).flat().includes("c1"));
});

test("밤→투표→다음 밤→최종 투표를 동일 입력으로 재현하며 종료 상태 재판정 거절", () => {
  const first = resolved(resolveNightStep(night, [action("m", "c1"), action("d", "c1")]));
  const tied = resolved(resolveVoteStep({ ...first, phase: "vote" }, [vote("m", "c2"), vote("c2", "m")]));
  const second = resolved(resolveNightStep(tied, [action("m", "c2")]));
  const end = resolved(resolveVoteStep({ ...second, phase: "vote" }, [vote("d", "m"), vote("i", "m"), vote("c1", "m"), vote("m", "d")]));
  assert.equal(end.winner, "시민 팀 승리");
  assert.equal(end.round, 3);
  assert.equal(resolveVoteStep(end, []).ok, false);
  assert.equal(resolveNightStep(end, []).ok, false);
});

test("동결 상태·제출을 변경하지 않고 반복 판정이 동일함", () => {
  const frozenPlayers = Object.freeze(players.map((p) => Object.freeze({ ...p, trust: Object.freeze({}) })));
  const state = Object.freeze({ ...dayVote, players: frozenPlayers });
  const commands = Object.freeze([Object.freeze(vote("d", "m")), Object.freeze(vote("c1", "m"))]);
  const before = JSON.stringify({ state, commands });
  assert.deepEqual(resolveVoteStep(state, commands), resolveVoteStep(state, commands));
  assert.equal(JSON.stringify({ state, commands }), before);
  const nightCommands = Object.freeze([Object.freeze(action("m", "c1"))]);
  const nightState = Object.freeze({ ...night, players: frozenPlayers });
  assert.deepEqual(resolveNightStep(nightState, nightCommands), resolveNightStep(nightState, nightCommands));
  assert.equal(nightState.players.find((p) => p.id === "c1")?.alive, true);
});
