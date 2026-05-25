import { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Player, Role, Phase, Message, SavedProfile, GameResultSummary, 
  GameMode, VoteDecision, PersonalityType, Difficulty, GameEventType,
  DialogueFeedback
} from "./types";
import { 
  PROFILE_STORAGE_KEY, MAX_HISTORY_ITEMS, botNames, 
  personalityLines, personalityAnswers, personalityTraits, 
  personalityReactions, dailyCases 
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
      dialogueFeedback: Array.isArray(parsed.dialogueFeedback) ? parsed.dialogueFeedback : [],
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
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [gameResultSummary, setGameResultSummary] = useState<GameResultSummary | null>(null);
  const [mafiaCaughtCount, setMafiaCaughtCount] = useState(0);
  const [interrogationCount, setInterrogationCount] = useState(0);
  const [correctVoteCount, setCorrectVoteCount] = useState(0);
  const [roleActionSuccessCount, setRoleActionSuccessCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<GameEventType>("none");
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
    const lastMessage = messages[messages.length - 1];
    const isDeathMorning = lastMessage?.system && lastMessage.text.includes("탈락했습니다");
    const isLateGame = round >= 4;

    speakers.forEach((speaker) => {
      const suspects = visibleTargets.filter((p) => p.id !== speaker.id);
      const suspect = suspects.length > 0 ? pickRandom(suspects) : null;
      const p = speaker.personality || "logical";
      
      let pool = [...personalityLines[p]];
      
      // 상황별 특수 대사 풀 선택
      if (isDeathMorning && Math.random() > 0.4) {
        pool = [...personalityReactions[p].death];
      } else if (isLateGame && Math.random() > 0.5) {
        pool = [...personalityReactions[p].lateGame];
      } else if (mafiaCaughtCount > 0 && Math.random() > 0.6) {
        // 마피아 검거 후 반응 추가 (추후 constants에 추가 필요)
        pool = [
          ...pool,
          ...({
            logical: ["마피아 한 명을 잡았으니 이제 나머지 동선을 추적하면 됩니다.", "검거된 마피아와 접점이 없던 사람들을 유심히 봐야겠어요."],
            aggressive: ["거봐요, 제가 맞다고 했죠? 남은 마피아 놈도 당장 끌어냅시다!", "이제 한 명 남았나요? 다 끝장내버립시다."],
            timid: ["정말 마피아였군요... 다행이에요. 이제 조금은 안심이 돼요.", "한 명이라도 잡아서 정말 다행이에요..."],
            emotional: ["정의는 승리하는 법이에요! 우리 팀의 단합이 빛을 발했네요.", "마피아가 잡히는 걸 보니 마음이 좀 놓이네요."],
            cynic: ["운 좋게 한 명 걸렸나 보네요. 그래봤자 아직 끝난 건 아니죠.", "마피아도 참 허술하네요. 잡히다니 한심합니다."],
          }[p] || []),
        ];
      }

      let line = pickRandom(pool);

      // 마피아 전용 '심리적 단서' 삽입 (15% 확률)
      if (speaker.role === "mafia" && Math.random() > 0.85) {
        const tells = [
          "저는 정말 결백합니다. 제발 믿어주세요.",
          "왜 다들 저를 쳐다보시는 것 같죠? 기분 탓인가요...",
          "조금 혼란스럽네요. 누가 마피아인지 전혀 모르겠어요.",
          "말수가 적다고 의심받는 건 억울합니다.",
        ];
        line = pickRandom(tells);
      }

      // 템플릿 치환 로직 (NPC 이름이나 의심 대상 삽입)
      if (suspect && Math.random() > 0.4 && !line.includes("님")) {
        const connectors = {
          logical: [`${suspect.name}님은 왜 그렇게 생각하시죠?`, `${suspect.name}님의 아까 발언이 좀 걸리네요.`],
          aggressive: [`${suspect.name}님, 당신 정체가 뭐야?`, `자꾸 입 닫고 있는 ${suspect.name}님이 제일 수상해요.`],
          timid: [`${suspect.name}님이 마피아일까 봐 너무 무서워요...`, `${suspect.name}님, 혹시 화나신 건 아니죠?`],
          emotional: [`${suspect.name}님과는 끝까지 믿고 가고 싶었는데...`, `${suspect.name}님, 저한테 하실 말씀 없나요?`],
          cynic: [`${suspect.name}님, 연기 좀 살살 하시지 그래요.`, `${suspect.name}님이 시민이라고? 지나가던 개가 웃겠네요.`],
        }[p] || [];
        
        if (connectors.length > 0) {
          line = `${line} ${pickRandom(connectors)}`;
        }
      }

      addMessage(speaker.name, line);
    });
  }, [alivePlayers, visibleTargets, messages, round, mafiaCaughtCount, addMessage]);

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
    
    let thresholdAdjustment = 0;
    if ((gameMode === "daily" && dailyCase.isHard) || (gameMode === "normal" && difficulty === "hard")) {
      thresholdAdjustment = -1;
    } else if (gameMode === "normal" && difficulty === "easy") {
      thresholdAdjustment = 1;
    }
    const highSuspicionThreshold = Math.max(1, trait.voteThreshold + thresholdAdjustment);

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
    const instinctProb = { logical: 0.8, aggressive: 0.6, timid: 0.9, emotional: 0.5, cynic: 0.7 }[pType];
    if (bot.role !== "mafia" && Math.random() > instinctProb) {
      const actualMafia = choices.filter((p) => p.role === "mafia");
      const targets = actualMafia.filter((p) => (bot.trust[p.id] || 0) <= 0);
      if (targets.length > 0) {
        return { target: pickRandom(targets), reason: pType === "emotional" ? "왠지 모를 위협을 느껴 지목했습니다." : "분석 결과 수상한 정황이 포착되었습니다." };
      }
    }
    return { target: pickRandom(choices), reason: "뚜렷한 단서가 없어 상황을 지켜보며 선택했습니다." };
  }, [gameMode, difficulty, dailyCase.isHard]);

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
          mafiaCaughtCount, totalRounds: round,
          interrogationCount, correctVoteCount, roleActionSuccessCount,
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
  }, [gameMode, profile, todayKey, dailyCase, messages, round, mafiaCaughtCount, addMessage]);

  const startGame = useCallback((mode: GameMode = "normal", diff: Difficulty = "normal") => {
    const names = shuffle(botNames).slice(0, playerCount - 1);
    const mafiaCount = Math.max(1, Math.floor(playerCount / 4));
    const roles: Role[] = [...Array<Role>(mafiaCount).fill("mafia"), ...(playerCount >= 5 ? ["doctor"] as Role[] : []), ...(playerCount >= 6 ? ["detective"] as Role[] : [])];
    while (roles.length < playerCount) roles.push("citizen");
    const assignedRoles = shuffle(roles);
    const personalities: PersonalityType[] = ["logical", "aggressive", "timid", "emotional", "cynic"];

    const createdPlayers: Player[] = [
      { id: "me", name: myName.trim() || "나", role: assignedRoles[0], alive: true, human: true, suspicion: 0, trust: {} },
      ...names.map((name, index) => ({ id: createId("bot"), name, role: assignedRoles[index + 1], alive: true, human: false, suspicion: 0, trust: {}, personality: pickRandom(personalities) })),
    ];

    const human = createdPlayers.find(p => p.human);
    const intro = mode === "daily" ? `오늘의 사건 '${dailyCase.title}'이 시작되었습니다. ${dailyCase.briefing} 당신의 역할은 ${human?.role}입니다.` : `게임이 시작되었습니다. 당신의 역할은 ${human?.role}입니다. 난이도: ${diff === "easy" ? "쉬움" : (diff === "hard" ? "어려움" : "보통")}`;
    
    setPlayers(createdPlayers);
    setRound(1);
    setPhase("night");
    setGameMode(mode);
    setDifficulty(diff);
    setWinner(null);
    setGameResultSummary(null);
    setQuestionTargetId("");
    setNightTargetId("");
    setVoteTargetId("");
    setMafiaCaughtCount(0);
    setInterrogationCount(0);
    setCorrectVoteCount(0);
    setRoleActionSuccessCount(0);
    setMessages([{ id: createId("msg"), sender: "사회자", text: intro, system: true }]);
  }, [myName, playerCount, dailyCase]);

  const interrogateTarget = useCallback(() => {
    const target = players.find(p => p.id === questionTargetId);
    if (!target || !target.alive || !me) return;

    addMessage(me.name, `${target.name}님, 어젯밤 뭐 했는지 설명해주세요.`);
    const p = target.personality || "logical";
    const answers = personalityAnswers[p];
    
    // 심문 일관성 로직: 시민은 항상 같은 대답, 마피아는 확률적으로 대답이 바뀜
    const previousAnswer = messages.find(m => m.sender === target.name && m.text.includes("밤"))?.text;
    let answer = "";
    
    if (target.role === "mafia") {
      // 마피아는 30% 확률로 다른 대답을 하거나 '마피아 전용 힌트' 대사를 함
      const isSlipUp = Math.random() > 0.7;
      if (isSlipUp) {
        answer = pickRandom([
          ...answers.mafia,
          "어... 그게... 그냥 별일 없었어요. 왜 자꾸 물어보시죠?",
          "밤에 뭘 했는지 일일이 다 기억해야 하나요? 피곤하네요.",
          "저는 제 할 일을 했을 뿐입니다. 너무 몰아세우지 마세요.",
        ]);
      } else {
        answer = previousAnswer || pickRandom(answers.mafia);
      }
    } else {
      // 시민 및 특수 역할은 항상 일관된 진술 유지
      answer = previousAnswer || (target.role === "citizen" ? pickRandom(answers.citizen) : pickRandom(answers.power));
    }

    addMessage(target.name, answer);

    setInterrogationCount((c) => c + 1);

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
      if (target) {
        addMessage("사회자", `${target.name}님은 ${target.role === "mafia" ? "마피아" : "마피아가 아닙니다"}.`, true);
        if (target.role === "mafia") setRoleActionSuccessCount((c) => c + 1);
      }
    }

    if (mafias.length === 0) addMessage("사회자", nightEvent, true);
    else if (mafiaTargetId && mafiaTargetId !== protectedId) {
      nextPlayers = nextPlayers.map(p => p.id === mafiaTargetId ? { ...p, alive: false } : p);
      const target = players.find(p => p.id === mafiaTargetId);
      nightEvent = `밤 사이 ${target?.name ?? "누군가"}님이 탈락했습니다.`;
      if (me.role === "mafia") setRoleActionSuccessCount((c) => c + 1);
      setLastEvent("elimination");
      addMessage("사회자", nightEvent, true);
    } else {
      nightEvent = "의사의 보호로 밤 공격이 실패했습니다.";
      if (me.role === "doctor" && protectedId === mafiaTargetId) setRoleActionSuccessCount((c) => c + 1);
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
      if (humanVoteTarget.role === "mafia") {
        setMafiaCaughtCount((c) => c + 1);
        setCorrectVoteCount((c) => c + 1);
      }
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

    const event = tied ? "투표가 동률로 끝나 아무도 탈락하지 않았습니다." : `투표 결과 ${players.find(p => p.id === eliminatedId)?.name ?? "누군가"}님이 탈락했습니다.`;
    if (!tied) setLastEvent("elimination");
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

  const submitDialogueFeedback = useCallback((feedback: Omit<DialogueFeedback, "timestamp">) => {
    setProfile((current) => ({
      ...current,
      dialogueFeedback: [
        ...(current.dialogueFeedback || []),
        { ...feedback, timestamp: new Date().toISOString() },
      ].slice(-100), // 최대 100개까지만 보관
    }));
  }, []);

  return {
    phase, round, myName, setMyName, playerCount, setPlayerCount, players, alivePlayers, 
    visibleTargets, messages, chatText, setChatText, questionTargetId, setQuestionTargetId, 
    nightTargetId, setNightTargetId, voteTargetId, setVoteTargetId, winner, gameMode, difficulty,
    gameResultSummary, profile, todayKey, dailyCase, dailyRewardAvailable: profile.lastDailyRewardDate !== todayKey,
    me, level: Math.floor(profile.xp / 100) + 1, currentLevelXp: profile.xp % 100, 
    lastEvent, resetEvent: () => setLastEvent("none"),
    submitDialogueFeedback,
    startGame, submitChat: (e: React.FormEvent) => { e.preventDefault(); if (me?.alive && chatText.trim()) { addMessage(me.name, chatText.trim()); botDiscuss(1); setChatText(""); } },
    interrogateTarget, resolveNight, startVote: () => { botDiscuss(); setPhase("vote"); setVoteTargetId(""); addMessage("사회자", "투표를 시작합니다. 의심되는 참가자를 선택하세요.", true); }, 
    resolveVote, resetGame,
  };
}
