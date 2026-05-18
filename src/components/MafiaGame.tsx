"use client";

import { FormEvent, useMemo, useState } from "react";

type Role = "mafia" | "doctor" | "detective" | "citizen";
type Phase = "setup" | "night" | "day" | "vote" | "ended";

type Player = {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
};

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  system?: boolean;
};

const phaseLabels: Record<Phase, string> = {
  setup: "대기",
  night: "밤",
  day: "낮",
  vote: "투표",
  ended: "종료",
};

const roleLabels: Record<Role, string> = {
  mafia: "마피아",
  doctor: "의사",
  detective: "경찰",
  citizen: "시민",
};

const initialNames = ["규웅", "민서", "지아", "현우", "서윤", "도윤"].join("\n");

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createPlayers(names: string[]): Player[] {
  const mafiaCount = Math.max(1, Math.floor(names.length / 4));
  const roles: Role[] = [
    ...Array<Role>(mafiaCount).fill("mafia"),
    ...(names.length >= 5 ? (["doctor"] as Role[]) : []),
    ...(names.length >= 6 ? (["detective"] as Role[]) : []),
  ];

  while (roles.length < names.length) {
    roles.push("citizen");
  }

  const assignedRoles = shuffle(roles);
  return names.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    role: assignedRoles[index],
    alive: true,
  }));
}

function getWinner(players: Player[]) {
  const alive = players.filter((player) => player.alive);
  const mafiaCount = alive.filter((player) => player.role === "mafia").length;
  const citizenCount = alive.length - mafiaCount;

  if (mafiaCount === 0) return "시민 팀 승리";
  if (mafiaCount >= citizenCount) return "마피아 팀 승리";
  return null;
}

export function MafiaGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState(1);
  const [nameInput, setNameInput] = useState(initialNames);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [speakerId, setSpeakerId] = useState("");
  const [chatText, setChatText] = useState("");
  const [mafiaTargetId, setMafiaTargetId] = useState("");
  const [doctorTargetId, setDoctorTargetId] = useState("");
  const [detectiveTargetId, setDetectiveTargetId] = useState("");
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [winner, setWinner] = useState<string | null>(null);

  const alivePlayers = useMemo(
    () => players.filter((player) => player.alive),
    [players],
  );
  const mafiaPlayers = useMemo(
    () => players.filter((player) => player.alive && player.role === "mafia"),
    [players],
  );
  const doctor = players.find((player) => player.alive && player.role === "doctor");
  const detective = players.find(
    (player) => player.alive && player.role === "detective",
  );
  const voteComplete =
    alivePlayers.length > 0 && Object.keys(votes).length === alivePlayers.length;

  function addSystemMessage(text: string) {
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), sender: "사회자", text, system: true },
    ]);
  }

  function startGame() {
    const names = nameInput
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 10);

    if (names.length < 4) {
      addSystemMessage("최소 4명이 필요합니다.");
      return;
    }

    const nextPlayers = createPlayers(names);
    setPlayers(nextPlayers);
    setSpeakerId(nextPlayers[0].id);
    setPhase("night");
    setRound(1);
    setWinner(null);
    setVotes({});
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: "사회자",
        text: "게임을 시작합니다. 각자의 역할을 확인하고 1라운드 밤을 진행하세요.",
        system: true,
      },
    ]);
  }

  function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const speaker = players.find((player) => player.id === speakerId);

    if (!speaker || !speaker.alive || !chatText.trim()) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), sender: speaker.name, text: chatText.trim() },
    ]);
    setChatText("");
  }

  function resolveNight() {
    const target = players.find((player) => player.id === mafiaTargetId);
    const saved = doctorTargetId && doctorTargetId === mafiaTargetId;
    const inspected = players.find((player) => player.id === detectiveTargetId);
    let nextPlayers = players;

    if (target && !saved) {
      nextPlayers = players.map((player) =>
        player.id === target.id ? { ...player, alive: false } : player,
      );
      addSystemMessage(`밤 사이 ${target.name}님이 탈락했습니다.`);
    } else if (target && saved) {
      addSystemMessage("의사의 보호로 밤 공격이 실패했습니다.");
    } else {
      addSystemMessage("밤이 지나갔습니다. 아무도 공격받지 않았습니다.");
    }

    if (inspected) {
      addSystemMessage(
        `경찰 조사 결과: ${inspected.name}님은 ${
          inspected.role === "mafia" ? "마피아" : "마피아가 아닙니다"
        }.`,
      );
    }

    finishStep(nextPlayers, "day");
    setMafiaTargetId("");
    setDoctorTargetId("");
    setDetectiveTargetId("");
  }

  function startVote() {
    setVotes({});
    setPhase("vote");
    addSystemMessage("투표를 시작합니다. 생존자는 한 명씩 의심 대상을 선택하세요.");
  }

  function resolveVote() {
    const counts = Object.values(votes).reduce<Record<string, number>>((acc, id) => {
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const tied = sorted.length > 1 && sorted[0][1] === sorted[1][1];
    let nextPlayers = players;

    if (top && !tied) {
      const eliminated = players.find((player) => player.id === top[0]);
      if (eliminated) {
        nextPlayers = players.map((player) =>
          player.id === eliminated.id ? { ...player, alive: false } : player,
        );
        addSystemMessage(
          `투표 결과 ${eliminated.name}님이 탈락했습니다. 역할은 ${
            roleLabels[eliminated.role]
          }였습니다.`,
        );
      }
    } else {
      addSystemMessage("투표가 동률로 끝나 아무도 탈락하지 않았습니다.");
    }

    setVotes({});
    finishStep(nextPlayers, "night");
  }

  function finishStep(nextPlayers: Player[], nextPhase: Phase) {
    const result = getWinner(nextPlayers);
    setPlayers(nextPlayers);

    if (result) {
      setWinner(result);
      setPhase("ended");
      addSystemMessage(`${result}로 게임이 종료되었습니다.`);
      return;
    }

    if (nextPhase === "night") {
      setRound((current) => current + 1);
      addSystemMessage("다음 밤이 시작됩니다.");
    }

    setPhase(nextPhase);
  }

  function resetGame() {
    setPhase("setup");
    setRound(1);
    setPlayers([]);
    setMessages([]);
    setVotes({});
    setWinner(null);
    setMafiaTargetId("");
    setDoctorTargetId("");
    setDetectiveTargetId("");
  }

  return (
    <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 text-neutral-100 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
      <aside className="grid gap-4 self-start lg:sticky lg:top-5">
        <div className="border border-neutral-800 bg-neutral-950 p-4">
          <p className="text-xs font-semibold text-red-300">PARTY CHAT GAME</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Mafia Chat Game</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            브라우저에서 바로 진행 가능한 마피아 채팅 게임입니다. 참가자를
            입력하고 역할 배정, 밤 행동, 낮 토론, 투표를 순서대로 진행하세요.
          </p>
        </div>

        <div className="border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">게임 상태</h2>
            <span className="bg-red-500 px-2 py-1 text-xs font-bold text-white">
              {phase === "setup" ? "대기" : `${round}R`}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <StatusItem label="단계" value={phaseLabels[phase]} />
            <StatusItem label="생존" value={`${alivePlayers.length}명`} />
            <StatusItem label="마피아" value={`${mafiaPlayers.length}명`} />
            <StatusItem label="결과" value={winner ?? "진행 중"} />
          </dl>
        </div>

        {players.length > 0 && (
          <div className="border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="text-lg font-semibold">참가자</h2>
            <div className="mt-3 grid gap-2">
              {players.map((player) => (
                <div
                  className="flex items-center justify-between border border-neutral-800 px-3 py-2 text-sm"
                  key={player.id}
                >
                  <span
                    className={
                      player.alive ? "text-white" : "text-neutral-500 line-through"
                    }
                  >
                    {player.name}
                  </span>
                  <span className="text-neutral-400">{roleLabels[player.role]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="grid gap-4">
        {phase === "setup" && (
          <Panel title="게임방 만들기">
            <p className="text-sm text-neutral-400">
              참가자 이름을 줄마다 입력하세요. 4명부터 시작할 수 있고 최대 10명까지
              반영됩니다.
            </p>
            <textarea
              className="mt-4 min-h-48 w-full resize-y border border-neutral-700 bg-neutral-950 p-3 text-sm text-white outline-none focus:border-red-400"
              onChange={(event) => setNameInput(event.target.value)}
              value={nameInput}
            />
            <button
              className="mt-4 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400"
              onClick={startGame}
              type="button"
            >
              역할 배정하고 시작
            </button>
          </Panel>
        )}

        {phase === "night" && (
          <Panel title="밤 행동">
            <div className="grid gap-4 md:grid-cols-3">
              <ActionSelect
                label="마피아 제거 대상"
                onChange={setMafiaTargetId}
                players={alivePlayers.filter((player) => player.role !== "mafia")}
                value={mafiaTargetId}
              />
              <ActionSelect
                disabled={!doctor}
                label={doctor ? `의사 보호 대상 (${doctor.name})` : "의사 없음"}
                onChange={setDoctorTargetId}
                players={alivePlayers}
                value={doctorTargetId}
              />
              <ActionSelect
                disabled={!detective}
                label={detective ? `경찰 조사 대상 (${detective.name})` : "경찰 없음"}
                onChange={setDetectiveTargetId}
                players={alivePlayers.filter((player) => player.id !== detective?.id)}
                value={detectiveTargetId}
              />
            </div>
            <button
              className="mt-5 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:bg-neutral-700"
              disabled={!mafiaTargetId}
              onClick={resolveNight}
              type="button"
            >
              밤 결과 처리
            </button>
          </Panel>
        )}

        {(phase === "day" || phase === "vote") && (
          <Panel title="낮 토론 채팅">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-neutral-400">생존자만 발언할 수 있습니다.</p>
              {phase === "day" && (
                <button
                  className="bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400"
                  onClick={startVote}
                  type="button"
                >
                  투표 시작
                </button>
              )}
            </div>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]"
              onSubmit={submitChat}
            >
              <select
                className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-sm text-white outline-none focus:border-red-400"
                onChange={(event) => setSpeakerId(event.target.value)}
                value={speakerId}
              >
                {alivePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <input
                className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-sm text-white outline-none focus:border-red-400"
                onChange={(event) => setChatText(event.target.value)}
                placeholder="채팅을 입력하세요"
                value={chatText}
              />
              <button
                className="bg-neutral-100 px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-white"
                type="submit"
              >
                전송
              </button>
            </form>
          </Panel>
        )}

        {phase === "vote" && (
          <Panel title="투표">
            <div className="grid gap-3 md:grid-cols-2">
              {alivePlayers.map((voter) => (
                <label className="grid gap-2 text-sm" key={voter.id}>
                  <span className="font-medium text-neutral-200">{voter.name}</span>
                  <select
                    className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400"
                    onChange={(event) =>
                      setVotes((current) => ({
                        ...current,
                        [voter.id]: event.target.value,
                      }))
                    }
                    value={votes[voter.id] ?? ""}
                  >
                    <option value="">대상 선택</option>
                    {alivePlayers
                      .filter((target) => target.id !== voter.id)
                      .map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.name}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
            </div>
            <button
              className="mt-5 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:bg-neutral-700"
              disabled={!voteComplete}
              onClick={resolveVote}
              type="button"
            >
              투표 결과 처리
            </button>
          </Panel>
        )}

        {phase === "ended" && (
          <div className="border border-red-500 bg-red-950/40 p-5">
            <h2 className="text-2xl font-bold text-white">{winner}</h2>
            <p className="mt-2 text-sm text-red-100">
              게임이 종료되었습니다. 역할표와 진행 로그를 확인한 뒤 새 게임을 시작할 수
              있습니다.
            </p>
            <button
              className="mt-4 bg-white px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-red-100"
              onClick={resetGame}
              type="button"
            >
              새 게임
            </button>
          </div>
        )}

        <div className="min-h-80 border border-neutral-800 bg-neutral-950 p-5">
          <h2 className="text-xl font-semibold">진행 로그</h2>
          <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-neutral-500">아직 메시지가 없습니다.</p>
            ) : (
              messages.map((message) => (
                <article
                  className={`border p-3 ${
                    message.system
                      ? "border-red-900 bg-red-950/30"
                      : "border-neutral-800 bg-neutral-900"
                  }`}
                  key={message.id}
                >
                  <p className="text-xs font-semibold text-neutral-400">
                    {message.sender}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-neutral-100">
                    {message.text}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </main>
    </section>
  );
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="mt-1 font-semibold text-white">{value}</dd>
    </div>
  );
}

function ActionSelect({
  disabled,
  label,
  onChange,
  players,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  players: Player[];
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-neutral-200">{label}</span>
      <select
        className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400 disabled:text-neutral-600"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">대상 선택</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </label>
  );
}
