import assert from "node:assert/strict";
import test from "node:test";
import { projectForViewer, projectMessagesForViewer, revealedPlayers, visibleNightTargets } from "../src/components/mafia/engine/view";
import type { InternalMessage } from "../src/components/mafia/engine/view";
import type { GameState } from "../src/components/mafia/engine/types";
import type { Player, Role } from "../src/components/mafia/types";

function player(id: string, role: Role): Player {
  return { id, name: `참가자-${id}`, role, alive: true, human: id === "c", suspicion: 987, trust: { m: -777 }, personality: "logical" };
}
const players = [player("m", "mafia"), player("m2", "mafia"), player("d", "doctor"), player("i", "detective"), player("c", "citizen")];
const messages: InternalMessage[] = [
  { id: "public", sender: "사회자", text: "공개 탈락 알림", system: true, audience: { type: "public" } },
  { id: "investigation", sender: "사회자", text: "형사 개인 조사 결과", system: true, audience: { type: "private", playerId: "i" } },
  { id: "reward", sender: "사회자", text: "개인 보상", audience: { type: "private", playerId: "c" } },
  { id: "reason", sender: "사회자", text: "마피아의 내부 투표 근거", audience: { type: "private", playerId: "m" } },
];
const state: GameState = { phase: "night", round: 2, players, winner: null, nightActions: { m: "c", d: "d", i: "m" }, votes: { c: "m", i: "c" } };

function view(id: string, input = state) {
  const result = projectForViewer(input, id, messages);
  assert.ok(result);
  return result;
}

test("동일 내부 상태에서 참가자별 역할·개인 로그가 다르게 투영됨", () => {
  for (const participant of players) {
    const result = view(participant.id);
    assert.equal(result.self.role, participant.role);
    for (const visible of result.players) {
      if (visible.id === participant.id) assert.equal(visible.role, participant.role);
      else assert.equal(Object.hasOwn(visible, "role"), false);
      assert.equal(Object.hasOwn(visible, "suspicion"), false);
      assert.equal(Object.hasOwn(visible, "trust"), false);
    }
  }
  assert.deepEqual(view("i").messages.map((m) => m.id), ["public", "investigation"]);
  assert.deepEqual(view("c").messages.map((m) => m.id), ["public", "reward"]);
  assert.deepEqual(view("m").messages.map((m) => m.id), ["public", "reason"]);
  assert.deepEqual(view("m2").messages.map((m) => m.id), ["public"]);
  assert.equal(view("i").messages.find((m) => m.id === "investigation")?.personal, true);
  assert.equal(Object.hasOwn(view("i").messages[0], "personal"), false);
  assert.equal(Object.hasOwn(view("m").players.find((p) => p.id === "m2")!, "role"), false);
});

test("JSON에도 전체 역할표·내부 수치·다른 사람의 행동·로그 메타데이터를 포함하지 않음", () => {
  const result = JSON.parse(JSON.stringify(view("c")));
  assert.deepEqual(Object.keys(result).sort(), ["messages", "phase", "players", "round", "self", "winner"]);
  assert.deepEqual(result.messages.map((m: { id: string }) => m.id), ["public", "reward"]);
  assert.equal(result.players.filter((p: { role?: Role }) => p.role !== undefined).length, 1);
  for (const secret of ["suspicion", "trust", "audience", "nightActions", "votes", "개인 조사", "내부 투표 근거"]) {
    assert.ok(!JSON.stringify(result).includes(secret), secret);
  }
});

test("밤 행동·미집계 투표는 현재 단계에서 본인의 선택만 노출", () => {
  assert.equal(view("m").nightTargetId, "c");
  assert.equal(Object.hasOwn(view("m"), "voteTargetId"), false);
  assert.equal(Object.hasOwn(view("c"), "nightTargetId"), false);
  const voted = view("c", { ...state, phase: "vote" });
  assert.equal(voted.voteTargetId, "m");
  assert.equal(Object.hasOwn(voted, "nightTargetId"), false);
  assert.equal(Object.hasOwn(view("m", { ...state, phase: "vote" }), "voteTargetId"), false);
});

test("참가자가 아닌 요청에는 상태·공개 로그도 반환하지 않음", () => {
  for (const id of ["", "stranger", "__proto__", "constructor"]) {
    assert.equal(projectForViewer(state, id, messages), null);
    assert.deepEqual(projectMessagesForViewer(players, messages, id), []);
  }
});

test("탈락자의 참가자 권한은 유지하지만 다른 사람의 조사나 역할은 계속 비공개", () => {
  const result = view("c", { ...state, players: players.map((p) => p.id === "c" ? { ...p, alive: false } : p) });
  assert.equal(result.self.alive, false);
  assert.deepEqual(result.messages.map((m) => m.id), ["public", "reward"]);
  assert.equal(result.players.find((p) => p.id === "m")?.role, undefined);
  assert.deepEqual(visibleNightTargets(result.self, result.players), []);
});

test("종료 후 모든 역할을 공개해도 개인 로그·밤 대상·보류 투표는 공유하지 않음", () => {
  const ended = { ...state, phase: "ended" as const, winner: "시민 팀 승리" as const };
  const result = view("c", ended);
  assert.deepEqual(result.players.map((p) => p.role), players.map((p) => p.role));
  assert.equal(result.winner, ended.winner);
  assert.deepEqual(result.messages.map((m) => m.id), ["public", "reward"]);
  assert.equal(Object.hasOwn(result, "nightTargetId"), false);
  assert.equal(Object.hasOwn(result, "voteTargetId"), false);
  assert.deepEqual(revealedPlayers(state), []);
  const archive = revealedPlayers(ended);
  assert.deepEqual(archive.map((p) => p.role), players.map((p) => p.role));
  assert.ok(archive.every((p) => !Object.hasOwn(p, "trust") && !Object.hasOwn(p, "suspicion")));
});

test("표시 대상 목록은 다른 참가자의 비공개 역할에 의존하지 않음", () => {
  const result = view("m");
  const choices = visibleNightTargets(result.self, result.players).map((p) => p.id);
  const swapped = view("m", { ...state, players: players.map((p) => p.id === "m2" ? { ...p, role: "citizen" } : p) });
  assert.deepEqual(visibleNightTargets(swapped.self, swapped.players).map((p) => p.id), choices);
  assert.ok(choices.includes("m2"));
  assert.ok(!choices.includes("m"));
  const doctor = view("d");
  assert.ok(visibleNightTargets(doctor.self, doctor.players).some((p) => p.id === "d"));
  const citizen = view("c");
  assert.deepEqual(visibleNightTargets(citizen.self, citizen.players), []);
});

test("필드 허용 목록으로 추가 내부 필드와 잘못된 공개 범위를 배제", () => {
  const enriched = players.map((p) => ({ ...p, internalSecret: "sentinel", nested: { role: p.role } }));
  const extra = { ...messages[0], debugSecret: "sentinel", senderId: "internal" };
  const unscoped = { id: "old", sender: "사회자", text: "scope missing" } as InternalMessage;
  const result = projectForViewer({ ...state, players: enriched, winner: "마피아 팀 승리" }, "c", [...messages, extra, unscoped]);
  assert.ok(result);
  assert.equal(result.winner, null);
  assert.ok(!JSON.stringify(result).includes("sentinel"));
  assert.ok(!JSON.stringify(result).includes("scope missing"));
  assert.ok(!JSON.stringify(result).includes("senderId"));
  const inherited = Object.create({ c: "m" }) as Record<string, string>;
  assert.equal(Object.hasOwn(view("c", { ...state, phase: "vote", votes: inherited }), "voteTargetId"), false);
});

test("출력 변경이 내부 상태·로그를 바꾸지 않고 재투영은 동일", () => {
  const before = JSON.stringify({ state, messages });
  const first = view("i");
  const expected = view("i");
  first.self.role = "citizen";
  first.players[0].name = "changed";
  first.messages[0].text = "changed";
  assert.deepEqual(view("i"), expected);
  assert.equal(JSON.stringify({ state, messages }), before);
});
