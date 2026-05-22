"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Role = "mafia" | "doctor" | "detective" | "citizen";
type Phase = "setup" | "night" | "day" | "vote" | "ended";
type GameMode = "normal" | "daily";

type Player = {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
  human: boolean;
  suspicion: number;
};

type Message = {
  id: string;
  sender: string;
  text: string;
  system?: boolean;
};

type PlayHistoryEntry = {
  id: string;
  endedAt: string;
  result: string;
  role: Role;
  round: number;
  survived: boolean;
  xpGained: number;
  levelAfter: number;
  titleAfter: string;
};

type SavedProfile = {
  xp: number;
  history: PlayHistoryEntry[];
  lastDailyRewardDate?: string;
};

type GameResultSummary = {
  result: string;
  role: Role;
  team: "시민 팀" | "마피아 팀";
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  levelProgress: number;
  titleBefore: string;
  titleAfter: string;
  survived: boolean;
  keyEvents: string[];
  dailyCaseTitle?: string;
  dailyRewardXp: number;
  dailyRewardClaimed: boolean;
};

type DailyCase = {
  title: string;
  briefing: string;
  rewardXp: number;
};

type PreviewCommand = {
  command: string;
  response: string;
};

type PreviewActionGroup = {
  label: string;
  actions: string[];
};

const PROFILE_STORAGE_KEY = "mafia-chat-game:profile:v1";
const MAX_HISTORY_ITEMS = 10;

const dailyCases: DailyCase[] = [
  {
    title: "정전된 역 대합실",
    briefing: "불이 꺼진 사이 한 명이 사라졌습니다. 조용했던 참가자의 발언을 유심히 보세요.",
    rewardXp: 25,
  },
  {
    title: "비 내리는 골목 회의",
    briefing: "발자국이 겹쳐 단서가 흐려졌습니다. 투표 전 심문을 한 번 더 아끼지 마세요.",
    rewardXp: 25,
  },
  {
    title: "잠긴 라운지의 속삭임",
    briefing: "모두가 같은 방에 있었지만 진술이 어긋납니다. 방어적인 답변을 기록하세요.",
    rewardXp: 30,
  },
  {
    title: "새벽 항구의 호출",
    briefing: "마지막 무전 이후 항구가 조용해졌습니다. 밤 행동 결과와 낮 발언을 함께 보세요.",
    rewardXp: 30,
  },
];

const roleLabels: Record<Role, string> = {
  mafia: "마피아",
  doctor: "의사",
  detective: "경찰",
  citizen: "시민",
};

const roleDescriptions: Record<Role, string> = {
  mafia: "밤마다 한 명을 제거하고 낮에는 시민인 척 의심을 피하세요.",
  doctor: "밤마다 한 명을 보호해 마피아의 공격을 막으세요.",
  detective: "밤마다 한 명을 조사해 마피아인지 확인하세요.",
  citizen: "심문과 투표로 마피아를 찾아내세요.",
};

const roleImages: Record<Role, string> = {
  mafia: "/roles/mafia.png",
  doctor: "/roles/doctor.png",
  detective: "/roles/detective.png",
  citizen: "/roles/citizen.png",
};

const botNames = [
  "회색 후드",
  "낡은 시계",
  "검은 우산",
  "붉은 스카프",
  "푸른 노트",
  "하얀 장갑",
  "무음 알림",
];

const citizenAnswers = [
  "저는 어젯밤에 특별히 한 행동은 없어요. 발언 흐름으로 봐야 할 것 같아요.",
  "저를 몰아가는 이유가 약해요. 오히려 조용히 있던 쪽을 봐야 합니다.",
  "마피아라면 이렇게 먼저 해명하지 않았을 거예요.",
  "저는 시민 팀이에요. 투표를 서두르면 마피아가 좋아할 것 같습니다.",
];

const mafiaAnswers = [
  "저는 시민입니다. 지금 저를 의심하는 게 너무 갑작스러워요.",
  "마피아라면 이렇게 눈에 띄게 말하지 않죠. 다른 사람을 봐야 합니다.",
  "밤에 탈락한 사람과 저는 거의 대화가 없었어요. 연결점이 없습니다.",
  "이 분위기 자체가 누군가 의심을 돌리려고 만든 것 같아요.",
];

const powerRoleAnswers = [
  "제 역할은 공개하기 어렵지만 시민 팀에 도움이 되는 쪽으로 움직이고 있어요.",
  "지금 당장 제 정보를 다 말하면 마피아가 이용할 수 있습니다.",
  "저는 시민 팀입니다. 확실한 단서가 생기면 말하겠습니다.",
];

const botLines = [
  "어젯밤 흐름을 보면 조용했던 사람이 수상해요.",
  "너무 빨리 몰아가는 것도 마피아 같아요.",
  "투표 전까지 한 명씩 더 심문해보죠.",
  "마피아라면 지금 시민인 척 방향을 틀 것 같아요.",
  "발언이 적은 사람을 그냥 넘기면 안 될 것 같아요.",
];

const previewCommands: PreviewCommand[] = [
  {
    command: "/마피아 시작 6명",
    response: "6인 게임을 만들고 역할 카드를 비공개로 보냅니다.",
  },
  {
    command: "/마피아 오늘의사건",
    response: "오늘의 사건 브리핑과 첫 완료 보너스를 보여줍니다.",
  },
  {
    command: "/마피아 투표 검은 우산",
    response: "검은 우산에게 1표를 기록하고 남은 투표 상태를 갱신합니다.",
  },
];

const previewActionGroups: PreviewActionGroup[] = [
  {
    label: "밤 행동",
    actions: ["검은 우산", "붉은 스카프", "푸른 노트"],
  },
  {
    label: "낮 심문",
    actions: ["회색 후드 심문", "낡은 시계 심문", "무음 알림 심문"],
  },
  {
    label: "투표",
    actions: ["검은 우산 투표", "붉은 스카프 투표", "기권"],
  },
];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDailyCase(todayKey: string) {
  const seed = [...todayKey].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return dailyCases[seed % dailyCases.length];
}

function createPlayers(myName: string, count: number): Player[] {
  const names = shuffle(botNames).slice(0, count - 1);
  const mafiaCount = Math.max(1, Math.floor(count / 4));
  const roles: Role[] = [
    ...Array<Role>(mafiaCount).fill("mafia"),
    ...(count >= 5 ? (["doctor"] as Role[]) : []),
    ...(count >= 6 ? (["detective"] as Role[]) : []),
  ];

  while (roles.length < count) roles.push("citizen");

  const assignedRoles = shuffle(roles);
  return [
    {
      id: "me",
      name: myName,
      role: assignedRoles[0],
      alive: true,
      human: true,
      suspicion: 0,
    },
    ...names.map((name, index) => ({
      id: createId("bot"),
      name,
      role: assignedRoles[index + 1],
      alive: true,
      human: false,
      suspicion: 0,
    })),
  ];
}

function getWinner(players: Player[]) {
  const alive = players.filter((player) => player.alive);
  const mafiaCount = alive.filter((player) => player.role === "mafia").length;
  const citizenCount = alive.length - mafiaCount;

  if (mafiaCount === 0) return "시민 팀 승리";
  if (mafiaCount >= citizenCount) return "마피아 팀 승리";
  return null;
}

function phaseLabel(phase: Phase) {
  return { setup: "대기", night: "밤", day: "낮", vote: "투표", ended: "종료" }[
    phase
  ];
}

function nightActionLabel(role: Role) {
  if (role === "mafia") return "제거 대상";
  if (role === "doctor") return "보호 대상";
  if (role === "detective") return "조사 대상";
  return "대상";
}

function teamLabel(role: Role): GameResultSummary["team"] {
  return role === "mafia" ? "마피아 팀" : "시민 팀";
}

function getBotAnswer(player: Player) {
  if (player.role === "mafia") return pickRandom(mafiaAnswers);
  if (player.role === "doctor" || player.role === "detective") {
    return pickRandom(powerRoleAnswers);
  }
  return pickRandom(citizenAnswers);
}

function loadSavedProfile(): SavedProfile | null {
  try {
    if (typeof localStorage === "undefined") return null;

    const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!rawProfile) return null;

    const parsed = JSON.parse(rawProfile) as Partial<SavedProfile>;
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, MAX_HISTORY_ITEMS) : [],
      lastDailyRewardDate:
        typeof parsed.lastDailyRewardDate === "string"
          ? parsed.lastDailyRewardDate
          : undefined,
    };
  } catch {
    return null;
  }
}

function saveProfile(profile: SavedProfile) {
  try {
    if (typeof localStorage === "undefined") return;

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be unavailable in private browsing or quota-restricted contexts.
  }
}

function getInitialProfile(): SavedProfile {
  return loadSavedProfile() ?? { xp: 0, history: [] };
}

export function MafiaGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState(1);
  const [myName, setMyName] = useState("나");
  const [playerCount, setPlayerCount] = useState(6);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatText, setChatText] = useState("");
  const [questionTargetId, setQuestionTargetId] = useState("");
  const [nightTargetId, setNightTargetId] = useState("");
  const [voteTargetId, setVoteTargetId] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [gameResultSummary, setGameResultSummary] =
    useState<GameResultSummary | null>(null);
  const [profile, setProfile] = useState<SavedProfile>(getInitialProfile);
  const logEndRef = useRef<HTMLDivElement>(null);

  const todayKey = getTodayKey();
  const dailyCase = getDailyCase(todayKey);
  const dailyRewardAvailable = profile.lastDailyRewardDate !== todayKey;
  const me = players.find((player) => player.human) ?? null;
  const alivePlayers = useMemo(
    () => players.filter((player) => player.alive),
    [players],
  );
  const visibleTargets = alivePlayers.filter((player) => player.id !== me?.id);
  const { history: playHistory, xp } = profile;
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3001";

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  function addMessage(sender: string, text: string, system = false) {
    setMessages((current) => [
      ...current,
      { id: createId("msg"), sender, text, system },
    ]);
  }

  function startGame(mode: GameMode = "normal") {
    const createdPlayers = createPlayers(myName.trim() || "나", playerCount);
    const human = createdPlayers.find((player) => player.human);
    const intro =
      mode === "daily"
        ? `오늘의 사건 '${dailyCase.title}'이 시작되었습니다. ${dailyCase.briefing} 당신의 역할은 ${roleLabels[human?.role ?? "citizen"]}입니다.`
        : `게임이 시작되었습니다. 당신의 역할은 ${roleLabels[human?.role ?? "citizen"]}입니다.`;

    setPlayers(createdPlayers);
    setRound(1);
    setPhase("night");
    setGameMode(mode);
    setWinner(null);
    setGameResultSummary(null);
    setQuestionTargetId("");
    setNightTargetId("");
    setVoteTargetId("");
    setMessages([
      {
        id: createId("msg"),
        sender: "사회자",
        text: intro,
        system: true,
      },
    ]);
  }

  function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!me?.alive || !chatText.trim()) return;

    addMessage(me.name, chatText.trim());
    botDiscuss(1);
    setChatText("");
  }

  function interrogateTarget() {
    const target = players.find((player) => player.id === questionTargetId);
    if (!target || !target.alive) return;

    addMessage(me?.name ?? "나", `${target.name}님, 어젯밤 뭐 했는지 설명해주세요.`);
    addMessage(target.name, getBotAnswer(target));

    setPlayers((current) =>
      current.map((player) =>
        player.id === target.id
          ? { ...player, suspicion: player.suspicion + (target.role === "mafia" ? 2 : 1) }
          : player,
      ),
    );
    botDiscuss(1);
    setQuestionTargetId("");
  }

  function botDiscuss(count = 2) {
    const speakers = shuffle(alivePlayers.filter((player) => !player.human)).slice(
      0,
      count,
    );

    speakers.forEach((speaker) => {
      const suspects = visibleTargets.filter((player) => player.id !== speaker.id);
      const suspect = suspects.length > 0 ? pickRandom(suspects) : null;
      const line = suspect
        ? `${pickRandom(botLines)} 저는 ${suspect.name}님 발언을 더 보고 싶어요.`
        : pickRandom(botLines);
      addMessage(speaker.name, line);
    });
  }

  function resolveNight() {
    if (!me) return;

    let nextPlayers = [...players];
    let protectedId: string | undefined;
    let mafiaTargetId: string | undefined;
    const alive = nextPlayers.filter((player) => player.alive);
    const mafias = alive.filter((player) => player.role === "mafia");
    const doctor = alive.find((player) => player.role === "doctor");
    let nightEvent = "밤이 조용히 지나갔습니다.";

    if (me.role === "mafia") {
      mafiaTargetId = nightTargetId;
    } else {
      const mafiaChoices = alive.filter((player) => player.role !== "mafia");
      mafiaTargetId = pickRandom(mafiaChoices)?.id;
    }

    if (me.role === "doctor") protectedId = nightTargetId;
    else if (doctor) protectedId = pickRandom(alive)?.id;

    if (me.role === "detective" && nightTargetId) {
      const target = nextPlayers.find((player) => player.id === nightTargetId);
      if (target) {
        addMessage(
          "사회자",
          `${target.name}님은 ${target.role === "mafia" ? "마피아" : "마피아가 아닙니다"}.`,
          true,
        );
      }
    }

    if (mafias.length === 0) {
      addMessage("사회자", nightEvent, true);
    } else if (mafiaTargetId && mafiaTargetId !== protectedId) {
      nextPlayers = nextPlayers.map((player) =>
        player.id === mafiaTargetId ? { ...player, alive: false } : player,
      );
      const target = players.find((player) => player.id === mafiaTargetId);
      nightEvent = `밤 사이 ${target?.name ?? "누군가"}님이 탈락했습니다.`;
      addMessage("사회자", nightEvent, true);
    } else {
      nightEvent = "의사의 보호로 밤 공격이 실패했습니다.";
      addMessage("사회자", nightEvent, true);
    }

    finishStep(nextPlayers, "day", nightEvent);
    setNightTargetId("");
  }

  function startVote() {
    botDiscuss();
    setPhase("vote");
    setVoteTargetId("");
    addMessage("사회자", "투표를 시작합니다. 의심되는 참가자를 선택하세요.", true);
  }

  function resolveVote() {
    if (!me || !voteTargetId) return;

    const alive = players.filter((player) => player.alive);
    const votes: Record<string, number> = { [voteTargetId]: 1 };

    alive
      .filter((player) => !player.human)
      .forEach((bot) => {
        const choices = alive.filter((target) => target.id !== bot.id);
        const target = chooseBotVoteTarget(bot, choices);
        votes[target.id] = (votes[target.id] ?? 0) + 1;
      });

    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    const tied = sorted.length > 1 && sorted[0][1] === sorted[1][1];
    let nextPlayers = players;
    let voteEvent = "투표가 동률로 끝나 아무도 탈락하지 않았습니다.";

    if (!tied) {
      const eliminatedId = sorted[0][0];
      const eliminated = players.find((player) => player.id === eliminatedId);
      nextPlayers = players.map((player) =>
        player.id === eliminatedId ? { ...player, alive: false } : player,
      );
      voteEvent = `투표 결과 ${eliminated?.name ?? "누군가"}님이 탈락했습니다.`;
      addMessage("사회자", voteEvent, true);
    } else {
      addMessage("사회자", voteEvent, true);
    }

    finishStep(nextPlayers, "night", voteEvent);
    setVoteTargetId("");
  }

  function chooseBotVoteTarget(bot: Player, choices: Player[]) {
    const nonMafia = choices.filter((player) => player.role !== "mafia");
    const mafia = choices.filter((player) => player.role === "mafia");
    const mostSuspicious = [...choices].sort((a, b) => b.suspicion - a.suspicion)[0];

    if (mostSuspicious?.suspicion > 1 && Math.random() > 0.35) return mostSuspicious;
    if (bot.role === "mafia" && nonMafia.length > 0) return pickRandom(nonMafia);
    if (bot.role !== "mafia" && mafia.length > 0 && Math.random() > 0.55) {
      return pickRandom(mafia);
    }

    return pickRandom(choices);
  }

  function finishStep(nextPlayers: Player[], nextPhase: Phase, latestEvent: string) {
    const result = getWinner(nextPlayers);
    setPlayers(nextPlayers);

    if (result) {
      const baseXp = calculateXp(result, nextPlayers);
      const human = nextPlayers.find((player) => player.human);
      const dailyRewardClaimed =
        gameMode === "daily" && profile.lastDailyRewardDate !== todayKey;
      const dailyRewardXp = dailyRewardClaimed ? dailyCase.rewardXp : 0;
      const gainedXp = baseXp + dailyRewardXp;
      const nextXp = profile.xp + gainedXp;
      const levelBefore = Math.floor(profile.xp / 100) + 1;
      const levelAfter = Math.floor(nextXp / 100) + 1;
      const recentSystemEvents = messages
        .filter((message) => message.system)
        .map((message) => message.text)
        .slice(-3);
      const keyEvents = [...recentSystemEvents, latestEvent]
        .filter((event, index, events) => events.indexOf(event) === index)
        .slice(-4);

      setWinner(result);
      if (human) {
        setGameResultSummary({
          result,
          role: human.role,
          team: teamLabel(human.role),
          xpGained: gainedXp,
          levelBefore,
          levelAfter,
          levelProgress: nextXp % 100,
          titleBefore: getTitle(levelBefore),
          titleAfter: getTitle(levelAfter),
          survived: human.alive,
          keyEvents,
          dailyCaseTitle: gameMode === "daily" ? dailyCase.title : undefined,
          dailyRewardXp,
          dailyRewardClaimed,
        });
      }
      setProfile((current) => {
        const nextXp = current.xp + gainedXp;
        const nextLevel = Math.floor(nextXp / 100) + 1;
        const shouldClaimDailyReward =
          gameMode === "daily" && current.lastDailyRewardDate !== todayKey;

        return {
          xp: nextXp,
          lastDailyRewardDate: shouldClaimDailyReward
            ? todayKey
            : current.lastDailyRewardDate,
          history: human
            ? [
                {
                  id: createId("history"),
                  endedAt: new Date().toISOString(),
                  result,
                  role: human.role,
                  round,
                  survived: human.alive,
                  xpGained: gainedXp,
                  levelAfter: nextLevel,
                  titleAfter: getTitle(nextLevel),
                },
                ...current.history,
              ].slice(0, MAX_HISTORY_ITEMS)
            : current.history,
        };
      });
      setPhase("ended");
      addMessage(
        "사회자",
        `🏁 ${result}로 게임이 종료되었습니다. +${gainedXp} XP를 획득했습니다.`,
        true,
      );
      return;
    }

    if (nextPhase === "night") {
      setRound((current) => current + 1);
      addMessage("사회자", "다음 밤이 시작됩니다.", true);
    }

    setPhase(nextPhase);
  }

  function resetGame() {
    setPhase("setup");
    setRound(1);
    setPlayers([]);
    setMessages([]);
    setQuestionTargetId("");
    setNightTargetId("");
    setVoteTargetId("");
    setWinner(null);
    setGameMode("normal");
    setGameResultSummary(null);
  }

  return (
    <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 text-neutral-100 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
      <aside className="grid gap-4 self-start lg:sticky lg:top-5">
        <div className="border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-red-300">SOLO PARTY GAME</p>
            <a
              className="text-xs text-neutral-400 hover:text-white"
              href={docsUrl}
              rel="noreferrer"
              target="_blank"
            >
              Docs
            </a>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">Mafia Chat Game</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            나 혼자 접속해서 가상 참가자들과 진행하는 마피아 게임입니다. 내
            역할만 확인하고, 다른 참가자의 역할은 게임 종료 후 공개됩니다.
          </p>
        </div>

        <div className="border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="text-lg font-semibold">내 역할</h2>
          {me ? (
            <div className="mt-3 border border-red-900 bg-red-950/30 p-3">
              <div className="relative aspect-square overflow-hidden border border-neutral-800 bg-neutral-950">
                <Image
                  alt={`${roleLabels[me.role]} 역할 이미지`}
                  className="object-cover"
                  fill
                  priority
                  sizes="288px"
                  src={roleImages[me.role]}
                />
              </div>
              <p className="text-2xl font-bold text-white">{roleLabels[me.role]}</p>
              <p className="mt-2 text-sm leading-6 text-red-100">
                {roleDescriptions[me.role]}
              </p>
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
            <StatusItem label="단계" value={phaseLabel(phase)} />
            <StatusItem label="생존" value={`${alivePlayers.length}명`} />
            <StatusItem label="결과" value={winner ?? "진행 중"} />
            <StatusItem label="인원" value={`${players.length || playerCount}명`} />
          </dl>
          <div className="mt-4 border border-neutral-800 bg-neutral-950 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Lv. {level}</span>
              <span className="text-neutral-400">{currentLevelXp}/100 XP</span>
            </div>
            <div className="mt-2 h-2 bg-neutral-800">
              <div
                className="h-full bg-red-500"
                style={{ width: `${currentLevelXp}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              총 {xp} XP · {getTitle(level)}
            </p>
          </div>
        </div>

        {playHistory.length > 0 && (
          <div className="border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="text-lg font-semibold">플레이 기록</h2>
            <div className="mt-3 grid gap-2">
              {playHistory.slice(0, 3).map((entry) => (
                <div
                  className="border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
                  key={entry.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">{entry.result}</span>
                    <span className="text-xs text-red-300">+{entry.xpGained} XP</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {roleLabels[entry.role]} · {entry.round}R · Lv. {entry.levelAfter}
                  </p>
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
                    {player.human ? " (나)" : ""}
                  </span>
                  <span className="text-neutral-400">
                    {phase === "ended" || player.human ? roleLabels[player.role] : "비공개"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="grid gap-4">
        {phase === "setup" && (
          <Panel title="새 게임">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-neutral-200">내 이름</span>
                <input
                  className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400"
                  onChange={(event) => setMyName(event.target.value)}
                  value={myName}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-neutral-200">전체 인원</span>
                <select
                  className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400"
                  onChange={(event) => setPlayerCount(Number(event.target.value))}
                  value={playerCount}
                >
                  {[4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>
                      {count}명
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              className="mt-5 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400"
              onClick={() => startGame()}
              type="button"
            >
              역할 받고 시작
            </button>
          </Panel>
        )}

        {phase === "setup" && (
          <Panel title="오늘의 사건">
            <div className="border border-red-900 bg-red-950/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-red-200">{todayKey}</p>
                <span className="bg-neutral-950 px-2 py-1 text-xs font-semibold text-red-200">
                  {dailyRewardAvailable
                    ? `첫 완료 +${dailyCase.rewardXp} XP`
                    : "오늘 보상 수령 완료"}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">{dailyCase.title}</h2>
              <p className="mt-2 text-sm leading-6 text-red-100">
                {dailyCase.briefing}
              </p>
            </div>
            <button
              className="mt-5 bg-white px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-red-100"
              onClick={() => startGame("daily")}
              type="button"
            >
              오늘의 사건 시작
            </button>
          </Panel>
        )}

        {phase === "setup" && <ChatResponsePreview />}

        {phase === "night" && me && (
          <Panel title="밤 행동">
            {me.role === "citizen" ? (
              <p className="text-sm text-neutral-400">
                시민은 밤 행동이 없습니다. 밤 결과를 진행하세요.
              </p>
            ) : (
              <ActionSelect
                label={nightActionLabel(me.role)}
                onChange={setNightTargetId}
                players={nightTargets(me, visibleTargets)}
                value={nightTargetId}
              />
            )}
            <button
              className="mt-5 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:bg-neutral-700"
              disabled={me.role !== "citizen" && !nightTargetId}
              onClick={resolveNight}
              type="button"
            >
              밤 결과 보기
            </button>
          </Panel>
        )}

        {(phase === "day" || phase === "vote") && (
          <Panel title="낮 토론">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <ActionSelect
                label="심문할 참가자"
                onChange={setQuestionTargetId}
                players={visibleTargets}
                value={questionTargetId}
              />
              <button
                className="self-end bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:bg-neutral-700"
                disabled={!me?.alive || !questionTargetId}
                onClick={interrogateTarget}
                type="button"
              >
                심문하기
              </button>
            </div>

            <form
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
              onSubmit={submitChat}
            >
              <input
                className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-sm text-white outline-none focus:border-red-400"
                disabled={!me?.alive}
                onChange={(event) => setChatText(event.target.value)}
                placeholder={me?.alive ? "채팅을 입력하세요" : "탈락자는 발언할 수 없습니다"}
                value={chatText}
              />
              <button
                className="bg-neutral-100 px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-white disabled:bg-neutral-700 disabled:text-neutral-400"
                disabled={!me?.alive}
                type="submit"
              >
                전송
              </button>
            </form>
            {phase === "day" && (
              <button
                className="mt-4 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400"
                onClick={startVote}
                type="button"
              >
                투표로 넘어가기
              </button>
            )}
          </Panel>
        )}

        {phase === "vote" && (
          <Panel title="투표">
            {me?.alive ? (
              <ActionSelect
                label="의심 대상"
                onChange={setVoteTargetId}
                players={visibleTargets}
                value={voteTargetId}
              />
            ) : (
              <p className="text-sm text-neutral-400">탈락자는 투표할 수 없습니다.</p>
            )}
            <button
              className="mt-5 bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:bg-neutral-700"
              disabled={!!me?.alive && !voteTargetId}
              onClick={resolveVote}
              type="button"
            >
              투표 결과 보기
            </button>
          </Panel>
        )}

        {phase === "ended" && (
          <ResultCard
            fallbackLevel={level}
            fallbackTitle={getTitle(level)}
            onReset={resetGame}
            summary={gameResultSummary}
            winner={winner}
          />
        )}

        <div className="min-h-80 border border-neutral-800 bg-neutral-950 p-5">
          <h2 className="text-xl font-semibold">진행 로그</h2>
          <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto scroll-smooth">
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
            <div ref={logEndRef} />
          </div>
        </div>
      </main>
    </section>
  );
}

function nightTargets(me: Player, targets: Player[]) {
  if (me.role === "mafia") return targets.filter((player) => player.role !== "mafia");
  if (me.role === "detective") return targets;
  return [me, ...targets].filter((player) => player.alive);
}

function calculateXp(result: string, players: Player[]) {
  const me = players.find((player) => player.human);
  if (!me) return 20;

  const myTeam = me.role === "mafia" ? "마피아" : "시민";
  const winBonus = result.startsWith(myTeam) ? 50 : 20;
  const survivalBonus = me.alive ? 15 : 0;
  const roundBonus = Math.min(players.length * 2, 20);
  return winBonus + survivalBonus + roundBonus;
}

function getTitle(level: number) {
  if (level >= 10) return "마피아 헌터";
  if (level >= 7) return "심문 전문가";
  if (level >= 4) return "동네 추리왕";
  return "신입 탐정";
}

function ResultCard({
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

function ChatResponsePreview() {
  return (
    <Panel title="채팅 응답 미리보기">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="border border-neutral-800 bg-neutral-950 p-4">
          <h3 className="text-sm font-semibold text-white">명령 예시</h3>
          <div className="mt-3 grid gap-3">
            {previewCommands.map((item) => (
              <div className="border border-neutral-800 bg-neutral-900 p-3" key={item.command}>
                <p className="font-mono text-sm text-red-200">{item.command}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{item.response}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-4">
          <h3 className="text-sm font-semibold text-white">버튼 선택지</h3>
          <div className="mt-3 grid gap-3">
            {previewActionGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-neutral-500">{group.label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.actions.map((action) => (
                    <span
                      className="border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200"
                      key={action}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 border border-red-900 bg-red-950/30 p-4">
        <h3 className="text-sm font-semibold text-red-100">결과 카드 축약 예시</h3>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-neutral-200">
          <p>🏁 시민 팀 승리 · 내 역할 경찰</p>
          <p>💰 +92 XP · Lv. 3 진행도 68/100</p>
          <p>🏷️ 신입 탐정 · 주요 사건: 투표 결과 검은 우산 탈락</p>
        </div>
      </div>
    </Panel>
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
  label,
  onChange,
  players,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  players: Player[];
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-neutral-200">{label}</span>
      <select
        className="border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-red-400"
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
