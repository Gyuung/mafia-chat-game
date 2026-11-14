import assert from "node:assert/strict";
import test from "node:test";
import { createRoleDeck, getActionTargets, getWinner, validateTargetCommand } from "../src/components/mafia/engine/rules";
import type { ActionState, TargetCommand } from "../src/components/mafia/engine/types";
import type { Phase, Player, Role } from "../src/components/mafia/types";

function player(id: string, role: Role, alive = true): Player {
  return { id, name: id, role, alive, human: id === "mafia", suspicion: 0, trust: {} };
}
const players = [player("mafia", "mafia"), player("ally", "mafia"), player("doctor", "doctor"), player("detective", "detective"), player("citizen", "citizen"), player("dead", "citizen", false)];
function validate(phase: Phase, type: TargetCommand["type"], actorId: string, targetId: string) {
  return validateTargetCommand({ phase, players }, { type, actorId, targetId });
}

test("4~8명 역할 구성과 잘못된 인원 검증", () => {
  const expected = [
    { mafia: 1, citizen: 3 },
    { mafia: 1, doctor: 1, citizen: 3 },
    { mafia: 1, doctor: 1, detective: 1, citizen: 3 },
    { mafia: 1, doctor: 1, detective: 1, citizen: 4 },
    { mafia: 2, doctor: 1, detective: 1, citizen: 4 },
  ];
  for (let count = 4; count <= 8; count++) {
    const deck = createRoleDeck(count);
    assert.equal(deck.length, count);
    const counts = deck.reduce<Record<string, number>>((acc, role) => { acc[role] = (acc[role] ?? 0) + 1; return acc; }, {});
    assert.deepEqual(counts, expected[count - 4]);
  }
  for (const count of [0, 3, 9, 4.5, NaN, Infinity]) {
    assert.throws(() => createRoleDeck(count), RangeError);
  }
});

test("생존 인원만으로 시민 전멸·마피아 전멸·동수·진행 중 판정", () => {
  assert.equal(getWinner([]), null);
  assert.equal(getWinner([player("dead", "mafia", false)]), null);
  assert.equal(getWinner([player("m", "mafia", false), player("c", "citizen")]), "시민 팀 승리");
  assert.equal(getWinner([player("m", "mafia")]), "마피아 팀 승리");
  assert.equal(getWinner([player("m", "mafia"), player("c", "doctor")]), "마피아 팀 승리");
  assert.equal(getWinner([player("m", "mafia"), player("d", "doctor"), player("c", "citizen")]), null);
});

test("모든 행동의 잘못된 단계와 알 수 없는·사망한 참가자 거절", () => {
  const actions = [
    { type: "night-action", phase: "night", actorId: "mafia" },
    { type: "vote", phase: "vote", actorId: "citizen" },
    { type: "interrogate", phase: "day", actorId: "citizen" },
  ] as const;
  for (const action of actions) {
    for (const phase of ["setup", "ended"] as const) {
      assert.deepEqual(validate(phase, action.type, action.actorId, "doctor"), { ok: false, reason: "wrong-phase" });
    }
    for (const id of ["dead", "missing"]) {
      assert.deepEqual(validate(action.phase, action.type, id, "doctor"), { ok: false, reason: "invalid-actor" });
      assert.deepEqual(validate(action.phase, action.type, action.actorId, id), { ok: false, reason: "invalid-target" });
    }
  }
  assert.equal(validate("day", "vote", "mafia", "doctor").ok, false);
  assert.equal(validate("vote", "night-action", "mafia", "doctor").ok, false);
  assert.equal(validate("night", "interrogate", "mafia", "doctor").ok, false);
});

test("역할별 밤 대상: 의사 자기 보호 허용, 마피아 팀원 공격과 시민 능력 거절", () => {
  assert.equal(validate("night", "night-action", "doctor", "doctor").ok, true);
  assert.equal(validate("night", "night-action", "mafia", "doctor").ok, true);
  assert.deepEqual(validate("night", "night-action", "mafia", "ally"), { ok: false, reason: "teammate-target" });
  assert.deepEqual(validate("night", "night-action", "detective", "detective"), { ok: false, reason: "self-target" });
  assert.equal(validate("night", "night-action", "detective", "mafia").ok, true);
  assert.deepEqual(validate("night", "night-action", "citizen", "doctor"), { ok: false, reason: "no-ability" });
});

test("투표는 같은 팀 지목도 허용하되 자기 투표는 거절, 심문은 낮·투표 단계에 허용", () => {
  assert.equal(validate("vote", "vote", "mafia", "ally").ok, true);
  for (const id of ["mafia", "doctor", "detective", "citizen"]) {
    assert.deepEqual(validate("vote", "vote", id, id), { ok: false, reason: "self-target" });
    assert.equal(validate("day", "interrogate", id, "dead").ok, false);
  }
  assert.equal(validate("day", "interrogate", "citizen", "doctor").ok, true);
  assert.equal(validate("vote", "interrogate", "citizen", "doctor").ok, true);
  assert.equal(validate("day", "interrogate", "citizen", "citizen").ok, false);
});

test("화면과 NPC가 공유하는 대상 목록은 현재 단계와 생존 여부를 반영한다", () => {
  assert.deepEqual(getActionTargets({ phase: "night", players }, "doctor", "night-action").map((p) => p.id), ["mafia", "ally", "doctor", "detective", "citizen"]);
  assert.deepEqual(getActionTargets({ phase: "night", players }, "mafia", "night-action").map((p) => p.id), ["doctor", "detective", "citizen"]);
  for (const type of ["night-action", "vote", "interrogate"] as const) {
    assert.deepEqual(getActionTargets({ phase: "night", players }, "dead", type), []);
    assert.deepEqual(getActionTargets({ phase: "ended", players }, "mafia", type), []);
  }
});

test("규칙 검사는 입력을 변경하지 않고 저장소·난수 없이 반복 가능하다", () => {
  const frozenPlayers = players.map((p) => Object.freeze({ ...p, trust: Object.freeze({ ...p.trust }) }));
  const state: ActionState = Object.freeze({ phase: "night", players: Object.freeze(frozenPlayers) });
  const before = JSON.stringify(state);
  for (let i = 0; i < 3; i++) {
    getWinner(state.players);
    assert.deepEqual(getActionTargets(state, "mafia", "night-action").map((p) => p.id), ["doctor", "detective", "citizen"]);
  }
  assert.equal(JSON.stringify(state), before);
});
