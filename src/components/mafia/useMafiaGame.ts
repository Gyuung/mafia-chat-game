import { projectForViewer, projectMessagesForViewer, revealedPlayers } from "./engine/view";
import type { Audience, InternalMessage } from "./engine/view";
import { resolveNightStep, resolveVoteStep } from "./engine/resolve";
import type { ResolvedStep } from "./engine/resolve";
import type { TargetCommand, Winner } from "./engine/types";
import { createRoleDeck, getActionTargets, validateTargetCommand } from "./engine/rules";
import { completeProfile } from "./progression";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { 
  Player, Phase, SavedProfile, GameResultSummary,
  GameMode, VoteDecision, PersonalityType, Difficulty, GameEventType,
  DialogueFeedback, PlayHistoryEntry
} from "./types";
import { 
  PROFILE_STORAGE_KEY, MAX_HISTORY_ITEMS, botNames, 
  personalityLines, personalityAnswers, personalityTraits, 
  personalityReactions, dailyCases, getTitle, personalityMafiaTells 
} from "./constants";

function shuffle<T>(items: T[]) {
  return items.toSorted(() => Math.random() - 0.5);
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

function calculateXp(result: string, players: Player[]) {
  const me = players.find((player) => player.human);
  if (!me) return 20;

  const myTeam = me.role === "mafia" ? "마피아" : "시민";
  const winBonus = result.startsWith(myTeam) ? 50 : 20;
  const survivalBonus = me.alive ? 15 : 0;
  const roundBonus = Math.min(players.length * 2, 20);
  return winBonus + survivalBonus + roundBonus;
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
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements.filter(
        (achievement) => achievement && typeof achievement.id === "string" && typeof achievement.unlockedAt === "string",
      ) : [],
      mafiaCaughtTotal: typeof parsed.mafiaCaughtTotal === "number" && Number.isFinite(parsed.mafiaCaughtTotal)
        ? Math.max(0, parsed.mafiaCaughtTotal) : undefined,
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
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [questionTargetId, setQuestionTargetId] = useState("");
  const [nightTargetId, setNightTargetId] = useState("");
  const [voteTargetId, setVoteTargetId] = useState("");
  const [winner, setWinner] = useState<Winner | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [gameResultSummary, setGameResultSummary] = useState<GameResultSummary | null>(null);
  const [mafiaCaughtCount, setMafiaCaughtCount] = useState(0);
  const [interrogationCount, setInterrogationCount] = useState(0);
  const [correctVoteCount, setCorrectVoteCount] = useState(0);
  const [roleActionSuccessCount, setRoleActionSuccessCount] = useState(0);
  const [receivedVote, setReceivedVote] = useState(false);
  const [lastEvent, setLastEvent] = useState<GameEventType>("none");
  const [profile, setProfile] = useState<SavedProfile>(() => loadSavedProfile() ?? { xp: 0, history: [] });

  const resolvedSteps = useRef(new Set<string>());

  const todayKey = getTodayKey();
  const dailyCase = getDailyCase(todayKey);
  
  const me = useMemo(() => players.find((p) => p.human) ?? null, [players]);
  const alivePlayers = useMemo(() => players.filter((p) => p.alive), [players]);
  const visibleTargets = useMemo(() => alivePlayers.filter((p) => p.id !== me?.id), [alivePlayers, me]);

  useEffect(() => {
    saveProfileToStorage(profile);
  }, [profile]);

  const addMessage = useCallback((sender: string, text: string, system = false, audience: Audience = { type: "public" }) => {
    setMessages((current) => [
      ...current,
      { id: createId("msg"), sender, text, system, audience },
    ]);
  }, []);

  const botDiscuss = useCallback((count = 2) => {
    const speakers = shuffle(alivePlayers.filter((p) => !p.human)).slice(0, count);

    const isLateGame = round >= 4;

    speakers.forEach((speaker) => {
      const speakerMessages = projectMessagesForViewer(players, messages, speaker.id);
      const lastMessage = speakerMessages[speakerMessages.length - 1];
      const isDeathMorning = lastMessage?.system && lastMessage.text.includes("탈락했습니다");
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
  }, [players, alivePlayers, visibleTargets, messages, round, mafiaCaughtCount, addMessage]);

  const chooseBotVoteTarget = useCallback((bot: Player, choices: Player[]): VoteDecision => {
    const pType = bot.personality || "logical";
    const trait = personalityTraits[pType];
    const scoredChoices = choices.map((player) => {
      const trustScore = bot.trust[player.id] || 0;
      const trustWeight = pType === "emotional" ? 2 : 1;
      const adjustedSuspicion = Math.max(0, player.suspicion - (trustScore * trustWeight));
      return { player, adjustedSuspicion };
    });
    const sortedBySuspicion = scoredChoices.toSorted((a, b) => b.adjustedSuspicion - a.adjustedSuspicion);
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

  const finishStep = useCallback((step: ResolvedStep, latestEvent: string, stepMessages: InternalMessage[], voteRecords?: Record<string, string[]>, metrics?: { correctVoteCount?: number; roleActionSuccessCount?: number; receivedVote?: boolean }) => {
    const stepKey = `${round}:${phase}`;
    if (resolvedSteps.current.has(stepKey)) return;
    resolvedSteps.current.add(stepKey);
    const nextPlayers = step.players;
    const res = step.winner;
    setPlayers(nextPlayers);
    setRound(step.round);
    setMessages((current) => [...current, ...stepMessages]);
    if (res) {
      const baseXp = calculateXp(res, nextPlayers);
      const human = nextPlayers.find((p) => p.human);
      const dailyRewardClaimed = gameMode === "daily" && profile.lastDailyRewardDate !== todayKey;
      const dailyRewardXp = dailyRewardClaimed ? dailyCase.rewardXp : 0;
      const gainedXp = baseXp + dailyRewardXp;
      const endMessage: InternalMessage = { id: createId("msg"), sender: "사회자", text: `🏁 ${res}로 게임이 종료되었습니다.`, system: true, audience: { type: "public" } };
      const rewardMessage: InternalMessage | null = human ? { id: createId("msg"), sender: "사회자", text: `+${gainedXp} XP를 획득했습니다.`, system: true, audience: { type: "private", playerId: human.id } } : null;
      setMessages((current) => [...current, endMessage, ...(rewardMessage ? [rewardMessage] : [])]);
      const nextXp = profile.xp + gainedXp;
      const levelBefore = Math.floor(profile.xp / 100) + 1;
      const levelAfter = Math.floor(nextXp / 100) + 1;
      const keyEvents = [...projectMessagesForViewer(nextPlayers, messages, human?.id ?? "").filter(m => m.system).map(m => m.text).slice(-3), latestEvent].filter((e, i, arr) => arr.indexOf(e) === i).slice(-4);

      // 상태 업데이트 지연을 피하기 위해 현재 값 기반으로 직접 계산
      const finalMafiaCaught = nextPlayers.filter(p => !p.human && p.role === "mafia" && !p.alive).length;

      setWinner(res);
      if (human) {
        const summary: GameResultSummary = {
          result: res, role: human.role, team: human.role === "mafia" ? "마피아 팀" : "시민 팀",
          xpGained: gainedXp, levelBefore, levelAfter, levelProgress: nextXp % 100,
          titleBefore: getTitle(levelBefore), titleAfter: getTitle(levelAfter),
          survived: human.alive, keyEvents, dailyCaseTitle: gameMode === "daily" ? dailyCase.title : undefined,
          dailyRewardXp, dailyRewardClaimed, voteRecords, finalPlayers: revealedPlayers(step),
          mafiaCaughtCount: finalMafiaCaught, totalRounds: round,
          interrogationCount,
          correctVoteCount: metrics?.correctVoteCount ?? correctVoteCount,
          roleActionSuccessCount: metrics?.roleActionSuccessCount ?? roleActionSuccessCount,
          receivedVote: metrics?.receivedVote ?? receivedVote,
        };
        setGameResultSummary(summary);

        const current = profile;
        const nXp = current.xp + gainedXp;
        const nLevel = Math.floor(nXp / 100) + 1;
        const historyEntry: PlayHistoryEntry = {
          id: createId("history"),
          endedAt: new Date().toISOString(),
          result: res,
          role: human.role,
          round,
          survived: human.alive,
          xpGained: gainedXp,
          levelAfter: nLevel,
          titleAfter: getTitle(nLevel),
          messages: projectMessagesForViewer(nextPlayers, [...messages, ...stepMessages, endMessage, ...(rewardMessage ? [rewardMessage] : [])], human.id),
          players: revealedPlayers(step),
        };
        const completed = completeProfile(current, summary, historyEntry);
        const achievementMessages: InternalMessage[] = completed.newlyUnlocked.map((achievement) => ({
          id: createId("msg"), sender: "사회자",
          text: `🏅 업적 달성: ${achievement.title}`, system: true, audience: { type: "private", playerId: human.id },
        }));
        historyEntry.messages?.push(...projectMessagesForViewer(nextPlayers, achievementMessages, human.id));
        setProfile({
          ...completed.profile,
          lastDailyRewardDate: dailyRewardClaimed ? todayKey : current.lastDailyRewardDate,
        });
        setMessages((currentMessages) => [...currentMessages, ...achievementMessages]);
      }
      setPhase("ended");
      return;
    }
    if (step.phase === "night") {
      addMessage("사회자", "다음 밤이 시작됩니다.", true);
    }
    setPhase(step.phase);
  }, [gameMode, profile, todayKey, dailyCase, messages, round, phase, correctVoteCount, interrogationCount, roleActionSuccessCount, receivedVote, addMessage]);

  const startGame = useCallback((mode: GameMode = "normal", diff: Difficulty = "normal") => {
    let availableNames = shuffle(botNames);
    let finalMyName = myName.trim();
    if (!finalMyName || finalMyName === "나") {
      finalMyName = availableNames[0];
      availableNames = availableNames.slice(1);
    } else {
      // 내가 입력한 이름이 봇 이름 목록에 있으면 그 이름은 제외
      availableNames = availableNames.filter(n => n !== finalMyName);
    }
    
    const names = availableNames.slice(0, playerCount - 1);
    const assignedRoles = shuffle(createRoleDeck(playerCount));
    const personalities: PersonalityType[] = ["logical", "aggressive", "timid", "emotional", "cynic"];

    const createdPlayers: Player[] = [
      { id: "me", name: finalMyName, role: assignedRoles[0], alive: true, human: true, suspicion: 0, trust: {} },
      ...names.map((name, index) => ({ id: createId("bot"), name, role: assignedRoles[index + 1], alive: true, human: false, suspicion: 0, trust: {}, personality: pickRandom(personalities) })),
    ];

    const human = createdPlayers.find(p => p.human);
    const intro = mode === "daily" ? `오늘의 사건 '${dailyCase.title}'이 시작되었습니다. ${dailyCase.briefing}` : `게임이 시작되었습니다. 난이도: ${diff === "easy" ? "쉬움" : (diff === "hard" ? "어려움" : "보통")}`;
    
    resolvedSteps.current.clear();
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
    setReceivedVote(false);
    setRoleActionSuccessCount(0);
    setMessages([
      { id: createId("msg"), sender: "사회자", text: intro, system: true, audience: { type: "public" } },
      { id: createId("msg"), sender: "사회자", text: `당신의 이름은 '${finalMyName}'이며 역할은 ${human?.role}입니다.`, system: true, audience: { type: "private", playerId: "me" } },
    ]);
  }, [myName, playerCount, dailyCase]);

  const interrogateTarget = useCallback(() => {
    const target = players.find(p => p.id === questionTargetId);
    if (!target || !me || !validateTargetCommand({ phase, players }, {
      type: "interrogate", actorId: me.id, targetId: questionTargetId,
    }).ok) return;

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
          ...personalityMafiaTells[p],
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
  }, [phase, players, questionTargetId, me, gameMode, dailyCase.isHard, messages, addMessage, botDiscuss]);

  const resolveNight = useCallback(() => {
    if (!me || phase !== "night" || resolvedSteps.current.has(`${round}:${phase}`)) return;
    const commands: TargetCommand[] = [];
    if (me.alive && me.role !== "citizen") {
      const command: TargetCommand = { type: "night-action", actorId: me.id, targetId: nightTargetId };
      if (!validateTargetCommand({ phase, players }, command).ok) {
        addMessage("사회자", "선택한 대상을 처리할 수 없습니다. 다른 대상을 선택해주세요.", true, { type: "private", playerId: me.id });
        return;
      }
      commands.push(command);
    }
    const mafia = players.find((p) => p.alive && p.role === "mafia");
    const doctor = players.find((p) => p.alive && p.role === "doctor");
    for (const bot of [mafia, doctor]) {
      if (!bot || bot.human || (bot.role === "mafia" && me.alive && me.role === "mafia")) continue;
      const target = pickRandom(getActionTargets({ phase, players }, bot.id, "night-action"));
      if (target) commands.push({ type: "night-action", actorId: bot.id, targetId: target.id });
    }
    const step = resolveNightStep({ phase, players, round }, commands);
    if (!step.ok) return;
    const stepMessages: InternalMessage[] = [];
    let nightEvent = "밤이 조용히 지나갔습니다.";
    for (const event of step.events) {
      if (event.type === "investigation") {
        const target = players.find((p) => p.id === event.targetId);
        stepMessages.push({ id: createId("msg"), sender: "사회자", text: `${target?.name}님은 ${event.isMafia ? "마피아" : "마피아가 아닙니다"}.`, system: true, audience: { type: "private", playerId: event.actorId } });
      } else if (event.type === "elimination") {
        nightEvent = `밤 사이 ${players.find((p) => p.id === event.targetId)?.name ?? "누군가"}님이 탈락했습니다.`;
        setLastEvent("elimination");
      } else if (event.type === "protected") {
        nightEvent = "의사의 보호로 밤 공격이 실패했습니다.";
      }
    }
    stepMessages.push({ id: createId("msg"), sender: "사회자", text: nightEvent, system: true, audience: { type: "public" } });
    const actionSuccess = step.actionSuccessIds.includes(me.id) ? 1 : 0;
    setRoleActionSuccessCount((count) => count + actionSuccess);
    finishStep(step, nightEvent, stepMessages, undefined, {
      roleActionSuccessCount: roleActionSuccessCount + actionSuccess,
    });
    setNightTargetId("");
  }, [me, phase, players, round, nightTargetId, roleActionSuccessCount, addMessage, finishStep]);

  const resolveVote = useCallback(() => {
    if (!me || phase !== "vote" || resolvedSteps.current.has(`${round}:${phase}`)) return;
    const commands: TargetCommand[] = [];
    const stepMessages: InternalMessage[] = [];
    const log = (sender: string, text: string, system = false, audience: Audience = { type: "public" }) => {
      stepMessages.push({ id: createId("msg"), sender, text, system, audience });
    };
    if (me.alive) {
      const command: TargetCommand = { type: "vote", actorId: me.id, targetId: voteTargetId };
      if (!validateTargetCommand({ phase, players }, command).ok) return;
      commands.push(command);
      log("사회자", `${me.name}님은 ${players.find((p) => p.id === voteTargetId)?.name}님에게 투표했습니다.`, true);
    }
    const decisions = players.filter((p) => p.alive && !p.human).flatMap((bot) => {
      const choices = getActionTargets({ phase, players }, bot.id, "vote");
      if (choices.length === 0) return [];
      const decision = chooseBotVoteTarget(bot, choices);
      commands.push({ type: "vote", actorId: bot.id, targetId: decision.target.id });
      if (bot.role === "mafia" && Math.random() > 0.7) {
        log(bot.name, pickRandom([
          "다들 너무 몰아가는 거 아니에요? 조금만 더 신중하죠.",
          "저는 일단 다수의 의견을 따르겠습니다.",
          "어쩔 수 없네요. 상황이 이렇게 됐으니...",
        ]));
      } else if (bot.personality === "timid" && Math.random() > 0.5) {
        log(bot.name, "정말 이분이 맞는 걸까요? 무서워요...");
      } else if (bot.personality === "aggressive" && Math.random() > 0.5) {
        log(bot.name, "무조건 이 사람입니다. 망설일 거 없어요!");
      }
      return [{ bot, decision }];
    });
    const step = resolveVoteStep({ phase, players, round }, commands);
    if (!step.ok) return;
    decisions.forEach(({ bot, decision }) => {
      log("사회자", `${bot.name}님은 ${decision.target.name}님에게 투표했습니다.`, true);
      log("사회자", `투표 선택 이유: ${decision.reason}`, true, { type: "private", playerId: bot.id });
    });
    const voteRecords = Object.fromEntries(Object.entries(step.ballots).map(([targetId, voterIds]) => [
      players.find((p) => p.id === targetId)?.name ?? targetId,
      voterIds.map((id) => players.find((p) => p.id === id)?.name ?? id),
    ]));
    const elimination = step.events.find((event) => event.type === "elimination");
    const event = elimination
      ? `투표 결과 ${players.find((p) => p.id === elimination.targetId)?.name ?? "누군가"}님이 탈락했습니다.`
      : step.events.some((event) => event.type === "tied-vote")
        ? "투표가 동률로 끝나 아무도 탈락하지 않았습니다."
        : "투표가 없어 아무도 탈락하지 않았습니다.";
    if (elimination) setLastEvent("elimination");
    log("사회자", event, true);
    const correctVote = step.correctVoterIds.includes(me.id) ? 1 : 0;
    setMafiaCaughtCount((count) => count + correctVote);
    setCorrectVoteCount((count) => count + correctVote);
    const nextReceivedVote = receivedVote || step.receivedVoteIds.includes(me.id);
    setReceivedVote(nextReceivedVote);
    finishStep(step, event, stepMessages, voteRecords, {
      correctVoteCount: correctVoteCount + correctVote,
      receivedVote: nextReceivedVote,
    });
    setVoteTargetId("");
  }, [me, phase, players, round, voteTargetId, receivedVote, correctVoteCount, chooseBotVoteTarget, finishStep]);

  const resetGame = useCallback(() => {
    resolvedSteps.current.clear();
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
    setMafiaCaughtCount(0);
    setInterrogationCount(0);
    setCorrectVoteCount(0);
    setRoleActionSuccessCount(0);
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

  const viewer = useMemo(() => projectForViewer({
    phase, round, players, winner,
    nightActions: me ? { [me.id]: nightTargetId } : {},
    votes: me ? { [me.id]: voteTargetId } : {},
  }, me?.id ?? "", messages), [phase, round, players, winner, me, nightTargetId, voteTargetId, messages]);
  const publicPlayers = viewer?.players ?? [];

  return {
    phase, round, myName, setMyName, playerCount, setPlayerCount,
    players: publicPlayers, alivePlayers: publicPlayers.filter((player) => player.alive),
    visibleTargets: publicPlayers.filter((player) => player.alive && player.id !== me?.id),
    messages: viewer?.messages ?? [], chatText, setChatText, questionTargetId, setQuestionTargetId,
    nightTargetId, setNightTargetId, voteTargetId, setVoteTargetId, winner, gameMode, difficulty,
    gameResultSummary, profile, todayKey, dailyCase, dailyRewardAvailable: profile.lastDailyRewardDate !== todayKey,
    me: viewer?.self ?? null, level: Math.floor(profile.xp / 100) + 1, currentLevelXp: profile.xp % 100,
    lastEvent, resetEvent: () => setLastEvent("none"),
    submitDialogueFeedback,
    startGame, submitChat: (e: React.FormEvent) => { e.preventDefault(); if (me?.alive && chatText.trim()) { addMessage(me.name, chatText.trim()); botDiscuss(1); setChatText(""); } },
    interrogateTarget, resolveNight, startVote: () => { if (phase !== "day" || resolvedSteps.current.has(`${round}:day`)) return; resolvedSteps.current.add(`${round}:day`); botDiscuss(); setPhase("vote"); setVoteTargetId(""); addMessage("사회자", "투표를 시작합니다. 의심되는 참가자를 선택하세요.", true); },
    resolveVote, resetGame,
  };
}
