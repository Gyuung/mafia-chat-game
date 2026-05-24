import { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Player, Role, Phase, Message, SavedProfile, GameResultSummary, 
  GameMode, DailyCase, VoteDecision, PersonalityType
} from "./types";
import { 
  PROFILE_STORAGE_KEY, MAX_HISTORY_ITEMS, botNames, 
  personalityLines, personalityAnswers, personalityTraits, 
  dailyCases 
} from "./constants";

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

function getWinner(players: Player[]) {
  const alive = players.filter((player) => player.alive);
  const mafiaCount = alive.filter((player) => player.role === "mafia").length;
  const citizenCount = alive.length - mafiaCount;

  if (mafiaCount === 0) return "시민 팀 승리";
  if (mafiaCount >= citizenCount) return "마피아 팀 승리";
  return null;
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

function loadSavedProfile(): SavedProfile | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!rawProfile) return null;
    const parsed = JSON.parse(rawProfile) as Partial<SavedProfile>;
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, MAX_HISTORY_ITEMS) : [],
      lastDailyRewardDate: typeof parsed.lastDailyRewardDate === "string" ? parsed.lastDailyRewardDate : undefined,
    };
  } catch { return null; }
}

function saveProfileToStorage(profile: SavedProfile) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch { }
}

export function useMafiaGame() {
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
  const [gameResultSummary, setGameResultSummary] = useState<GameResultSummary | null>(null);
  const [profile, setProfile] = useState<SavedProfile>(() => loadSavedProfile() ?? { xp: 0, history: [] });

  const todayKey = getTodayKey();
  const dailyCase = getDailyCase(todayKey);
  
  const me = useMemo(() => players.find((p) => p.human) ?? null, [players]);
  const alivePlayers = useMemo(() => players.filter((p) => p.alive), [players]);
  const visibleTargets = useMemo(() => alivePlayers.filter((p) => p.id !== me?.id), [alivePlayers, me]);

  useEffect(() => {
    saveProfileToStorage(profile);
  }, [profile]);

  const addMessage = useCallback((sender: string, text: string, system = false) => {
    setMessages((current) => [
      ...current,
      { id: createId("msg"), sender, text, system },
    ]);
  }, []);

  const botDiscuss = useCallback((count = 2) => {
    const speakers = shuffle(alivePlayers.filter((p) => !p.human)).slice(0, count);
    speakers.forEach((speaker) => {
      const suspects = visibleTargets.filter((p) => p.id !== speaker.id);
      const suspect = suspects.length > 0 ? pickRandom(suspects) : null;
      const p = speaker.personality || "logical";
      const lines = personalityLines[p];
      const line = suspect
        ? `${pickRandom(lines)} 저는 ${suspect.name}님 발언을 더 보고 싶어요.`
        : pickRandom(lines);
      addMessage(speaker.name, line);
    });
  }, [alivePlayers, visibleTargets, addMessage]);

  const chooseBotVoteTarget = useCallback((bot: Player, choices: Player[]): VoteDecision => {
    const pType = bot.personality || "logical";
    const trait = personalityTraits[pType];
    const scoredChoices = choices.map((player) => {
      const trustScore = bot.trust[player.id] || 0;
      const trustWeight = pType === "emotional" ? 2 : 1;
      const adjustedSuspicion = Math.max(0, player.suspicion - (trustScore * trustWeight));
      return { player, adjustedSuspicion };
    });
    const sortedBySuspicion = [...scoredChoices].sort((a, b) => b.adjustedSuspicion - a.adjustedSuspicion);
    const mostSuspicious = sortedBySuspicion[0];
    const highSuspicionThreshold = gameMode === "daily" && dailyCase.isHard ? trait.voteThreshold - 1 : trait.voteThreshold;

    if (mostSuspicious && mostSuspicious.adjustedSuspicion >= highSuspicionThreshold && Math.random() > 0.05) {
      return { target: mostSuspicious.player, reason: `${pType === "logical" ? "논리적으로 분석한 결과, " : ""}${mostSuspicious.adjustedSuspicion}만큼의 의심점이 발견되어 지목했습니다.` };
    }
    if (pType === "timid" && mostSuspicious.adjustedSuspicion < 2 && Math.random() > 0.5) {
      return { target: pickRandom(choices), reason: "아직 확신이 서지 않아 신중하게 결정했습니다." };
    }
    if (pType === "aggressive" && mostSuspicious.adjustedSuspicion >= 1 && Math.random() > 0.3) {
      return { target: mostSuspicious.player, reason: "가장 수상해 보이는 사람을 바로 압박하기로 했습니다." };
    }
    if (bot.role === "mafia") {
      const nonMafia = choices.filter((p) => p.role !== "mafia");
      if (nonMafia.length > 0) {
        const target = pickRandom(nonMafia);
        return { target, reason: pType === "aggressive" ? "시민 팀을 빠르게 제거하기 위해 선택했습니다." : "시민 팀 참가자 중 한 명을 몰아가기로 했습니다." };
      }
    }
    const instinctProb = { logical: 0.8, aggressive: 0.6, timid: 0.9, emotional: 0.5 }[pType];
    if (bot.role !== "mafia" && Math.random() > instinctProb) {
      const actualMafia = choices.filter((p) => p.role === "mafia");
      const targets = actualMafia.filter((p) => (bot.trust[p.id] || 0) <= 0);
      if (targets.length > 0) {
        return { target: pickRandom(targets), reason: pType === "emotional" ? "왠지 모를 위협을 느껴 지목했습니다." : "분석 결과 수상한 정황이 포착되었습니다." };
      }
    }
    return { target: pickRandom(choices), reason: "뚜렷한 단서가 없어 상황을 지켜보며 선택했습니다." };
  }, [gameMode, dailyCase.isHard]);

  const finishStep = useCallback((nextPlayers: Player[], nextPhase: Phase, latestEvent: string, voteRecords?: Record<string, string[]>) => {
    const res = getWinner(nextPlayers);
    setPlayers(nextPlayers);
    if (res) {
      const baseXp = calculateXp(res, nextPlayers);
      const human = nextPlayers.find((p) => p.human);
      const dailyRewardClaimed = gameMode === "daily" && profile.lastDailyRewardDate !== todayKey;
      const dailyRewardXp = dailyRewardClaimed ? dailyCase.rewardXp : 0;
      const gainedXp = baseXp + dailyRewardXp;
      const nextXp = profile.xp + gainedXp;
      const levelBefore = Math.floor(profile.xp / 100) + 1;
      const levelAfter = Math.floor(nextXp / 100) + 1;
      const keyEvents = [...messages.filter(m => m.system).map(m => m.text).slice(-3), latestEvent].filter((e, i, arr) => arr.indexOf(e) === i).slice(-4);

      setWinner(res);
      if (human) {
        setGameResultSummary({
          result: res, role: human.role, team: human.role === "mafia" ? "마피아 팀" : "시민 팀",
          xpGained: gainedXp, levelBefore, levelAfter, levelProgress: nextXp % 100,
          titleBefore: getTitle(levelBefore), titleAfter: getTitle(levelAfter),
          survived: human.alive, keyEvents, dailyCaseTitle: gameMode === "daily" ? dailyCase.title : undefined,
          dailyRewardXp, dailyRewardClaimed, voteRecords, finalPlayers: nextPlayers,
        });
      }
      setProfile((current) => {
        const nXp = current.xp + gainedXp;
        const nLevel = Math.floor(nXp / 100) + 1;
        return {
          xp: nXp, lastDailyRewardDate: (gameMode === "daily" && current.lastDailyRewardDate !== todayKey) ? todayKey : current.lastDailyRewardDate,
          history: human ? [{ id: createId("history"), endedAt: new Date().toISOString(), result: res, role: human.role, round, survived: human.alive, xpGained: gainedXp, levelAfter: nLevel, titleAfter: getTitle(nLevel) }, ...current.history].slice(0, MAX_HISTORY_ITEMS) : current.history,
        };
      });
      setPhase("ended");
      addMessage("사회자", `🏁 ${res}로 게임이 종료되었습니다. +${gainedXp} XP를 획득했습니다.`, true);
      return;
    }
    if (nextPhase === "night") {
      setRound((c) => c + 1);
      addMessage("사회자", "다음 밤이 시작됩니다.", true);
    }
    setPhase(nextPhase);
  }, [gameMode, profile, todayKey, dailyCase, messages, round, addMessage]);

  const startGame = useCallback((mode: GameMode = "normal") => {
    const names = shuffle(botNames).slice(0, playerCount - 1);
    const mafiaCount = Math.max(1, Math.floor(playerCount / 4));
    const roles: Role[] = [...Array<Role>(mafiaCount).fill("mafia"), ...(playerCount >= 5 ? ["doctor"] as Role[] : []), ...(playerCount >= 6 ? ["detective"] as Role[] : [])];
    while (roles.length < playerCount) roles.push("citizen");
    const assignedRoles = shuffle(roles);
    const personalities: PersonalityType[] = ["logical", "aggressive", "timid", "emotional"];

    const createdPlayers: Player[] = [
      { id: "me", name: myName.trim() || "나", role: assignedRoles[0], alive: true, human: true, suspicion: 0, trust: {} },
      ...names.map((name, index) => ({ id: createId("bot"), name, role: assignedRoles[index + 1], alive: true, human: false, suspicion: 0, trust: {}, personality: pickRandom(personalities) })),
    ];

    const human = createdPlayers.find(p => p.human);
    const intro = mode === "daily" ? `오늘의 사건 '${dailyCase.title}'이 시작되었습니다. ${dailyCase.briefing} 당신의 역할은 ${human?.role}입니다.` : `게임이 시작되었습니다. 당신의 역할은 ${human?.role}입니다.`;
    
    setPlayers(createdPlayers);
    setRound(1);
    setPhase("night");
    setGameMode(mode);
    setWinner(null);
    setGameResultSummary(null);
    setQuestionTargetId("");
    setNightTargetId("");
    setVoteTargetId("");
    setMessages([{ id: createId("msg"), sender: "사회자", text: intro, system: true }]);
  }, [myName, playerCount, dailyCase]);

  const interrogateTarget = useCallback(() => {
    const target = players.find(p => p.id === questionTargetId);
    if (!target || !target.alive || !me) return;

    addMessage(me.name, `${target.name}님, 어젯밤 뭐 했는지 설명해주세요.`);
    const p = target.personality || "logical";
    const answers = personalityAnswers[p];
    const answer = target.role === "mafia" ? pickRandom(answers.mafia) : (target.role === "citizen" ? pickRandom(answers.citizen) : pickRandom(answers.power));
    addMessage(target.name, answer);

    setPlayers((current) => current.map((p) => {
      if (p.id === target.id) {
        const nextTrust = { ...p.trust };
        nextTrust[me.id] = (nextTrust[me.id] || 0) - 1;
        const suspicionBonus = gameMode === "daily" && dailyCase.isHard ? 3 : 2;
        return { ...p, suspicion: p.suspicion + (target.role === "mafia" ? suspicionBonus : 1), trust: nextTrust };
      }
      return p;
    }));
    botDiscuss(1);
    setQuestionTargetId("");
  }, [players, questionTargetId, me, gameMode, dailyCase.isHard, addMessage, botDiscuss]);

  const resolveNight = useCallback(() => {
    if (!me) return;
    let nextPlayers = [...players];
    let protectedId: string | undefined;
    let mafiaTargetId: string | undefined;
    const alive = nextPlayers.filter(p => p.alive);
    const mafias = alive.filter(p => p.role === "mafia");
    const doctor = alive.find(p => p.role === "doctor");
    let nightEvent = "밤이 조용히 지나갔습니다.";

    if (me.role === "mafia") mafiaTargetId = nightTargetId;
    else {
      const choices = alive.filter(p => p.role !== "mafia");
      mafiaTargetId = pickRandom(choices)?.id;
    }

    if (me.role === "doctor") protectedId = nightTargetId;
    else if (doctor) protectedId = pickRandom(alive)?.id;

    if (me.role === "detective" && nightTargetId) {
      const target = nextPlayers.find(p => p.id === nightTargetId);
      if (target) addMessage("사회자", `${target.name}님은 ${target.role === "mafia" ? "마피아" : "마피아가 아닙니다"}.`, true);
    }

    if (mafias.length === 0) addMessage("사회자", nightEvent, true);
    else if (mafiaTargetId && mafiaTargetId !== protectedId) {
      nextPlayers = nextPlayers.map(p => p.id === mafiaTargetId ? { ...p, alive: false } : p);
      const target = players.find(p => p.id === mafiaTargetId);
      nightEvent = `밤 사이 ${target?.name ?? "누군가"}님이 탈락했습니다.`;
      addMessage("사회자", nightEvent, true);
    } else {
      nightEvent = "의사의 보호로 밤 공격이 실패했습니다.";
      addMessage("사회자", nightEvent, true);
    }
    finishStep(nextPlayers, "day", nightEvent);
    setNightTargetId("");
  }, [me, players, nightTargetId, addMessage, finishStep]);

  const resolveVote = useCallback(() => {
    if (!me || !voteTargetId) return;
    const alive = players.filter(p => p.alive);
    const votes: Record<string, number> = { [voteTargetId]: 1 };
    const voteRecords: Record<string, string[]> = {};
    const humanVoteTarget = alive.find(p => p.id === voteTargetId);
    if (humanVoteTarget) {
      addMessage("사회자", `${me.name}님은 ${humanVoteTarget.name}님에게 투표했습니다.`, true);
      voteRecords[humanVoteTarget.name] = [me.name];
    }

    const botDecisions = alive.filter(p => !p.human).map((bot) => {
      const choices = alive.filter(t => t.id !== bot.id);
      const decision = chooseBotVoteTarget(bot, choices);
      return { bot, decision };
    });

    botDecisions.forEach(({ bot, decision }) => {
      votes[decision.target.id] = (votes[decision.target.id] ?? 0) + 1;
      if (!voteRecords[decision.target.name]) voteRecords[decision.target.name] = [];
      voteRecords[decision.target.name].push(bot.name);
      addMessage("사회자", `${bot.name}님은 ${decision.target.name}님에게 투표했습니다. ${decision.reason}`, true);
    });

    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    const tied = sorted.length > 1 && sorted[0][1] === sorted[1][1];
    const eliminatedId = !tied ? sorted[0][0] : null;

    const nextPlayers = players.map((player) => {
      const nextTrust = { ...player.trust };
      Object.entries(voteRecords).forEach(([targetName, voters]) => {
        if (targetName === player.name) {
          voters.forEach((voterName) => {
            const voter = players.find(p => p.name === voterName);
            if (voter) nextTrust[voter.id] = (nextTrust[voter.id] || 0) - 2;
          });
        }
      });
      const myVoteTargetName = player.human ? humanVoteTarget?.name : botDecisions.find(d => d.bot.id === player.id)?.decision.target.name;
      if (myVoteTargetName) {
        (voteRecords[myVoteTargetName] || []).forEach((voterName) => {
          if (voterName !== player.name) {
            const voter = players.find(p => p.name === voterName);
            if (voter) nextTrust[voter.id] = (nextTrust[voter.id] || 0) + 1;
          }
        });
      }
      return { ...player, alive: player.id === eliminatedId ? false : player.alive, trust: nextTrust };
    });

    let event = tied ? "투표가 동률로 끝나 아무도 탈락하지 않았습니다." : `투표 결과 ${players.find(p => p.id === eliminatedId)?.name ?? "누군가"}님이 탈락했습니다.`;
    addMessage("사회자", event, true);
    finishStep(nextPlayers, "night", event, voteRecords);
    setVoteTargetId("");
  }, [me, players, voteTargetId, addMessage, chooseBotVoteTarget, finishStep]);

  const resetGame = useCallback(() => {
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
  }, []);

  return {
    phase, round, myName, setMyName, playerCount, setPlayerCount, players, alivePlayers, 
    visibleTargets, messages, chatText, setChatText, questionTargetId, setQuestionTargetId, 
    nightTargetId, setNightTargetId, voteTargetId, setVoteTargetId, winner, gameMode, 
    gameResultSummary, profile, todayKey, dailyCase, dailyRewardAvailable: profile.lastDailyRewardDate !== todayKey,
    me, level: Math.floor(profile.xp / 100) + 1, currentLevelXp: profile.xp % 100, 
    startGame, submitChat: (e: any) => { e.preventDefault(); if (me?.alive && chatText.trim()) { addMessage(me.name, chatText.trim()); botDiscuss(1); setChatText(""); } },
    interrogateTarget, resolveNight, startVote: () => { botDiscuss(); setPhase("vote"); setVoteTargetId(""); addMessage("사회자", "투표를 시작합니다. 의심되는 참가자를 선택하세요.", true); }, 
    resolveVote, resetGame,
  };
}
