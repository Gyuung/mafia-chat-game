import { DailyCase, PersonalityType, PersonalityTrait, Role, Achievement } from "./types";

export const PROFILE_STORAGE_KEY = "mafia-chat-game:profile:v1";
export const MAX_HISTORY_ITEMS = 10;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_game",
    title: "신입 탐정",
    description: "첫 게임을 무사히 마쳤습니다.",
    icon: "🔍",
    condition: () => true,
  },
  {
    id: "first_win",
    title: "첫 승리의 맛",
    description: "마피아 게임에서 처음으로 승리했습니다.",
    icon: "🏆",
    condition: (stats) => stats.result.includes("승리"),
  },
  {
    id: "mafia_hunter_1",
    title: "마피아 헌터",
    description: "마피아를 누적 5명 이상 검거했습니다.",
    icon: "🎯",
    condition: (stats, profile) => {
      const totalCaught = (profile.history || []).reduce((sum, h) => sum + (h.players?.filter(p => !p.human && p.role === "mafia" && !p.alive).length || 0), 0);
      return (totalCaught + stats.mafiaCaughtCount) >= 5;
    },
  },
  {
    id: "phoenix",
    title: "불사조",
    description: "탈락하지 않고 끝까지 살아남아 승리했습니다.",
    icon: "🔥",
    condition: (stats) => stats.survived && stats.result.includes("승리"),
  },
  {
    id: "sharp_insight",
    title: "예리한 통찰력",
    description: "정확한 투표로 마피아를 검거하는 데 기여했습니다.",
    icon: "✨",
    condition: (stats) => stats.correctVoteCount >= 2,
  },
  {
    id: "thorough_investigation",
    title: "철저한 수사",
    description: "한 게임에서 5회 이상 심문을 수행했습니다.",
    icon: "📝",
    condition: (stats) => stats.interrogationCount >= 5,
  },
  {
    id: "miraculous_defense",
    title: "기적의 방어",
    description: "의사로 활약하며 마피아의 공격을 성공적으로 막아냈습니다.",
    icon: "🛡️",
    condition: (stats) => stats.role === "doctor" && stats.roleActionSuccessCount >= 1,
  },
  {
    id: "perfect_alibi",
    title: "완벽한 알리바이",
    description: "마피아로 플레이하며 한 번도 투표로 지목되지 않고 승리했습니다.",
    icon: "🎭",
    condition: (stats) => stats.role === "mafia" && stats.result.includes("승리") && stats.survived,
  },
  {
    id: "daily_solver",
    title: "오늘의 해결사",
    description: "오늘의 사건을 성공적으로 해결했습니다.",
    icon: "📅",
    condition: (stats) => !!stats.dailyCaseTitle && stats.result.includes("승리"),
  },
  {
    id: "veteran_investigator",
    title: "베테랑 수사관",
    description: "레벨 10에 도달했습니다.",
    icon: "🎖️",
    condition: (stats) => stats.levelAfter >= 10,
  },
];

export const dailyCases: DailyCase[] = [
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
    title: "눈보라 속의 산장",
    briefing: "외부와 단절된 산장입니다. 서로의 알리바이가 엇갈리는 순간을 포착하세요.",
    rewardXp: 35,
  },
  {
    title: "버려진 지하 연구소",
    briefing: "기괴한 소음이 들립니다. 평소와 다른 말투를 사용하는 사람을 경계하세요.",
    rewardXp: 40,
  },
  {
    title: "호화 유람선의 무도회",
    briefing: "화려한 조명 뒤에 그림자가 숨어있습니다. 질문을 회피하는 태도를 유심히 보세요.",
    rewardXp: 30,
  },
  {
    title: "폭풍우 치는 외딴섬",
    briefing: "탈출구는 없습니다. 마지막 투표까지 긴장을 늦추지 마세요.",
    rewardXp: 45,
  },
  {
    title: "🚨 최후의 보루 (HARD)",
    briefing: "마피아들의 정체가 거의 드러났지만, 그만큼 더 필사적입니다. 압박 심문에 주의하세요.",
    rewardXp: 70,
    isHard: true,
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
  {
    title: "텅 빈 대저택의 복도",
    briefing: "발소리가 메아리칩니다. 평소보다 공격적인 진술을 경계하세요.",
    rewardXp: 35,
  },
  {
    title: "안개 자욱한 공원 벤치",
    briefing: "시야가 좁아졌습니다. 질문을 피하는 참가자를 끝까지 추적하세요.",
    rewardXp: 25,
  },
  {
    title: "자정의 도서관 열람실",
    briefing: "페이지 넘기는 소리만 들립니다. 논리적으로 어긋난 답변을 찾아내세요.",
    rewardXp: 30,
  },
  {
    title: "🚨 마피아 소굴 잠입 (HARD)",
    briefing: "마피아들이 매우 공격적입니다. 작은 실수도 용납되지 않는 위험한 임무입니다.",
    rewardXp: 60,
    isHard: true,
  },
  {
    title: "🚨 배신자의 아지트 (HARD)",
    briefing: "서로를 믿지 못하는 상황입니다. NPC들이 평소보다 더 쉽게 의심하고 공격합니다.",
    rewardXp: 55,
    isHard: true,
  },
];

export const roleLabels: Record<Role, string> = {
  mafia: "마피아",
  doctor: "의사",
  detective: "경찰",
  citizen: "시민",
};

export const roleDescriptions: Record<Role, string> = {
  mafia: "밤마다 한 명을 제거하고 낮에는 시민인 척 의심을 피하세요.",
  doctor: "밤마다 한 명을 보호해 마피아의 공격을 막으세요.",
  detective: "밤마다 한 명을 조사해 마피아인지 확인하세요.",
  citizen: "심문과 투표로 마피아를 찾아내세요.",
};

export const roleImages: Record<Role, string> = {
  mafia: "/roles/mafia.png",
  doctor: "/roles/doctor.png",
  detective: "/roles/detective.png",
  citizen: "/roles/citizen.png",
};

export const personalityTraits: Record<PersonalityType, PersonalityTrait> = {
  logical: {
    label: "논리파",
    description: "증거와 일관성을 중시하며 냉철하게 분석합니다.",
    dialogueStyles: [
      "지금 상황에서 가장 비논리적인 발언을 한 사람은...",
      "앞뒤가 맞지 않는 진술이 하나 있네요.",
      "감정에 호소하기보다는 팩트만 놓고 봅시다.",
      "확률적으로 볼 때, 마피아는 지금 가장 조용한 쪽일 겁니다.",
    ],
    voteThreshold: 3,
  },
  aggressive: {
    label: "공격파",
    description: "적극적으로 의심 대상을 지목하며 분위기를 주도합니다.",
    dialogueStyles: [
      "솔직히 말하세요. 당신이 마피아 맞죠?",
      "시간 끌 필요 있나요? 딱 봐도 수상한데.",
      "자꾸 발을 빼시는데, 그럴수록 더 의심스럽습니다.",
      "어물쩍 넘어가려고 하지 마세요. 제가 지켜보고 있습니다.",
    ],
    voteThreshold: 2,
  },
  timid: {
    label: "신중파",
    description: "결정을 내리는 데 신중하며 다수의 의견을 따르는 편입니다.",
    dialogueStyles: [
      "아직은 누구라고 확정 짓기 무섭네요...",
      "제 선택이 틀리면 어쩌죠? 조금 더 지켜봐요.",
      "다들 그렇게 생각하신다면...",
      "제가 잘못 본 게 아니었으면 좋겠는데...",
    ],
    voteThreshold: 5,
  },
  emotional: {
    label: "감정파",
    description: "직감과 인간관계를 중시하며 호불호가 명확합니다.",
    dialogueStyles: [
      "왠지 저 사람은 믿음이 안 가요.",
      "저를 의심하다니... 정말 실망이네요.",
      "기분이 묘하네요. 직감적으로 위험이 느껴져요.",
      "우리가 서로 믿어야 이길 수 있는데, 가슴이 아프네요.",
    ],
    voteThreshold: 4,
  },
  cynic: {
    label: "냉소파",
    description: "모두를 의심하며 비꼬는 말투로 불신을 드러냅니다.",
    dialogueStyles: [
      "여기서 정직한 척하는 사람이 제일 수상한 거 아시죠?",
      "다들 연기 참 잘하시네요. 아카데미 상이라도 줘야겠어요.",
      "어차피 누굴 믿든 배신당할 텐데, 무슨 상관인가요.",
      "시민인 척하는 꼴이 참 가솔롭네요.",
    ],
    voteThreshold: 3,
  },
};

export const botNames = [
  "회색 후드", "낡은 시계", "검은 우산", "붉은 스카프", "푸른 노트", 
  "하얀 장갑", "무음 알림", "노란 장화", "초록 숲", "보라 연기",
  "조용한 그림자", "빠른 발걸음", "무거운 안경", "부드러운 미소", "차가운 시선",
  "흐린 기억", "기울어진 모자", "낡은 가방", "끊어진 줄", "멈춘 심장",
  "깊은 숨소리", "낯선 목소리", "지워진 이름", "비어있는 의자", "어두운 골목"
];

export const personalityLines: Record<PersonalityType, string[]> = {
  logical: [
    "어젯밤 흐름을 분석해보면 조용했던 사람이 가장 확률이 높아요.",
    "너무 감정적인 호소는 오히려 논점을 흐릴 뿐입니다.",
    "발언 횟수가 적은 것보다, 발언의 내용이 어긋나는 게 핵심이죠.",
    "지금 누군가를 투표하려면 명확한 근거가 필요합니다.",
    "시스템적인 허점을 노리는 마피아를 찾아내야 합니다.",
  ],
  aggressive: [
    "어물쩍 넘어가지 마세요. 수상한 냄새가 납니다.",
    "마피아가 아니면 왜 그렇게 당황하시죠?",
    "저는 이미 한 명을 점찍어 뒀습니다. 도망갈 생각 마세요.",
    "적극적으로 나서지 않는 사람은 마피아라고 봐도 무방해요.",
    "당신의 그 어설픈 변명이 오히려 독이 되고 있네요.",
  ],
  timid: [
    "제 생각이 틀린 건 아닐까요? 무고한 시민을 잡을까 봐 겁나요.",
    "다들 조용히 계시니까 저도 말을 아끼게 되네요.",
    "혹시 제가 마피아의 타겟이 된 건 아닐지 걱정돼요.",
    "누구 한 명을 지목하는 게 마음이 편치 않네요.",
    "제 목소리가 너무 작은 건 아니죠? 저 정말 시민이에요.",
  ],
  emotional: [
    "왠지 모르게 저 사람의 눈빛이 흔들리는 것 같아요.",
    "서로 믿지 못하는 이 상황이 너무 슬프네요.",
    "직감이 말해주고 있어요. 우리 사이에 배신자가 있다고요.",
    "저를 끝까지 믿어줄 수 있는 분이 있을까요?",
    "마음이 시키는 대로 투표할 거예요. 거짓말은 느껴지거든요.",
  ],
  cynic: [
    "서로 위하는 척하는 꼴들이 참 보기 좋네요.",
    "어차피 한 명씩 죽어 나갈 텐데, 누가 마피아면 어떤가요.",
    "당신의 그 뻔한 변명, 이제 지겨워요.",
    "시민 팀이라고요? 웃기는 소리 하지 마세요.",
    "여기서 제일 착해 보이는 사람이 범인일 가능성이 크죠.",
  ],
};

export const personalityReactions: Record<PersonalityType, Record<"death" | "lateGame", string[]>> = {
  logical: {
    death: [
      "탈락자가 발생했군요. 희생자의 역할을 고려해 마피아의 의도를 분석해야 합니다.",
      "밤 사이 전력이 소실되었습니다. 이제 남은 인원들 간의 정황이 더 중요해졌어요.",
    ],
    lateGame: [
      "승부처입니다. 지금까지의 투표 기록과 발언을 대조해 최종 결론을 내야 합니다.",
      "남은 인원수를 고려할 때, 이번 투표가 시민 팀의 마지막 기회일 수 있습니다.",
    ],
  },
  aggressive: {
    death: [
      "결국 사단이 났네요! 마피아 놈들, 다음은 누구 차례라고 생각하는 거지?",
      "동료가 당하는 걸 보고만 있을 순 없습니다. 당장 범인을 찾아내서 되갚아주죠.",
    ],
    lateGame: [
      "이제 숨을 곳도 없겠지? 끝까지 몰아붙여서 정체를 밝혀내겠습니다.",
      "질질 끌 거 없습니다. 확신이 가는 놈부터 바로 투표해서 끝내버리죠.",
    ],
  },
  timid: {
    death: [
      "세상에... 정말로 탈락자가 나왔어요... 다음은 제가 되면 어쩌죠?",
      "점점 무서워져요. 우리 정말 이길 수 있는 볼까요?",
    ],
    lateGame: [
      "사람이 너무 적어서 이제는 누가 마피아여도 이상하지 않아요... 무서워서 말을 못 하겠어요.",
      "제 선택 하나로 게임이 끝날 수도 있다는 게 너무 부담스러워요.",
    ],
  },
  emotional: {
    death: [
      "너무 슬픈 아침이네요... 우리 중에 배신자가 있다는 게 다시 한번 실감 나요.",
      "어떻게 이럴 수가 있죠? 마음이 너무 아파서 견딜 수가 없어요.",
    ],
    lateGame: [
      "이제는 서로의 진심을 믿는 수밖에 없어요. 끝까지 믿음을 잃지 마세요.",
      "마지막까지 우리 시민 팀이 하나로 뭉치면 기적이 일어날 거예요.",
    ],
  },
  cynic: {
    death: [
      "하나둘씩 사라지는군요. 다음은 누가 저 세상 구경을 하러 갈지 기대되네요.",
      "예상했던 결과 아닌가요? 시민 팀의 무능함이 여실히 드러나는 아침입니다.",
    ],
    lateGame: [
      "거의 다 끝났네요. 마지막까지 광대처럼 춤추는 꼴들이 참 볼만합니다.",
      "누가 이기든 상관없어요. 어차피 이 지옥 같은 게임도 곧 끝날 테니까.",
    ],
  },
};

export const personalityAnswers: Record<PersonalityType, Record<"citizen" | "mafia" | "power", string[]>> = {
  logical: {
    citizen: [
      "제 진술에 모순이 있는지 검토해 보세요. 저는 오직 승리를 위해 협력합니다.",
      "의심의 근거가 논리적이지 않네요. 다른 가능성도 고려해 보시죠.",
      "밤사이 제 동선은 시민으로서 지극히 정상적이었습니다.",
    ],
    mafia: [
      "제가 마피아라면 더 효율적인 동선으로 움직였을 겁니다. 분석이 틀렸네요.",
      "객관적인 데이터 없이 저를 몰아가는 건 시민 팀의 손해입니다.",
      "알리바이가 완벽하지 않은 건 다른 분들도 마찬가지 아닌가요?",
    ],
    power: [
      "제 역할에 대해서는 추론을 통해 결론을 내주시기 바랍니다. 보안이 중요하니까요.",
      "특수 역할의 신분 노출은 게임을 위험하게 만들 수 있습니다.",
    ],
  },
  aggressive: {
    citizen: [
      "저를 의심할 시간에 진짜 범인이나 찾으시죠! 답답해 죽겠네요.",
      "제가 마피아였으면 당신부터 벌써 처리했을 겁니다.",
      "자꾸 건드리지 마세요. 시민끼리 싸우면 마피아만 좋아해요.",
    ],
    mafia: [
      "지금 절 의심하는 당신이야말로 마피아 아니에요? 적반하장이네요.",
      "근거 없이 몰아세우지 마세요. 진짜 마피아는 당신 뒤에 있을걸요?",
      "내가 마피아면 넌 벌써 죽었어. 고맙게 생각하라고.",
    ],
    power: [
      "내 역할을 여기서 다 밝히라고요? 당신 마피아지?",
      "내 정체가 궁금하면 밤에 직접 찾아오든가.",
    ],
  },
  timid: {
    citizen: [
      "저... 정말 저는 아무것도 몰라요. 시민일 뿐이에요.",
      "왜 저한테만 그러세요... 무서워요.",
      "그냥 밤새도록 집에서 가만히 있었어요. 믿어주세요.",
    ],
    mafia: [
      "제... 제가요? 전 그냥 가만히 있었는데... 오해하지 말아주세요.",
      "아무것도 기억나지 않아요. 밤에는 계속 눈을 감고 있었거든요.",
      "저 정말 아무것도 안 했어요. 그냥 잠만 잤는걸요...",
    ],
    power: [
      "아직은... 아직은 말할 때가 아니라고 생각해요. 죄송합니다.",
      "제 역할이 들키면 큰일 날 것 같아서... 조금만 더 기다려주세요.",
    ],
  },
  emotional: {
    citizen: [
      "우리가 서로 믿어야 마피아를 잡을 수 있어요. 제 진심을 알아주세요.",
      "저를 그렇게 보지 마세요. 마음이 너무 아프네요.",
      "제 목소리에서 진심이 느껴지지 않나요? 전 정말 시민이에요.",
    ],
    mafia: [
      "어떻게 저를 의심할 수가 있죠? 우리 대화도 많이 했잖아요.",
      "이런 분위기 정말 싫어요. 다들 너무 차갑네요.",
      "믿었던 사람한테 의심받는 기분이 어떤지 아세요?",
    ],
    power: [
      "제 느낌으로는... 제가 시민 팀의 중요한 열쇠가 될 것 같아요.",
      "제가 누구인지 밝히면 다들 깜짝 놀라실 거예요. 소중한 역할이거든요.",
    ],
  },
  cynic: {
    citizen: [
      "의심하는 건 자유지만, 나중에 후회해도 난 몰라요.",
      "시민이라고 말하면 믿어줄 건가요? 어차피 마음대로 할 거면서.",
      "난 내 할 일이나 할 테니, 당신들도 알아서들 하세요.",
    ],
    mafia: [
      "내가 마피아면 뭐 어쩌려고요? 투표라도 할 건가?",
      "다들 너무 진지해서 웃음이 나네요. 적당히들 좀 하세요.",
      "범인을 찾겠다고 설쳐대는 꼴이 참 가련하네요.",
    ],
    power: [
      "내 정체? 알아서 뭐 하게. 어차피 다 죽을 텐데.",
      "말해줘도 안 믿을 거 뻔한데, 입만 아프게 왜 물어봐요?",
    ],
  },
};

export const personalityMafiaTells: Record<PersonalityType, string[]> = {
  logical: [
    "어... 그게... 논리적으로 설명하자면 그냥 제 방에 있었어요.",
    "제 동선요? 그건... 효율적인 경로를 생각하다 보니 좀 늦게 들어갔네요.",
    "분석 결과에 따르면... 아니, 제 말은 저는 그냥 잤다는 겁니다.",
  ],
  aggressive: [
    "왜 나만 가지고 그래요? 진짜 짜증 나게!",
    "내가 마피아면 벌써 당신부터 처리했어. 자꾸 건드리지 마!",
    "말도 안 되는 소리 하지 마세요. 증거 있어?",
  ],
  timid: [
    "저... 저는 정말 아무것도 몰라요... 제발 믿어주세요...",
    "밤에요? 그냥... 무서워서 이불 속에만 있었어요...",
    "왜 저를 그렇게 쳐다보시죠? 전 정말 아니에요...",
  ],
  emotional: [
    "어떻게 저를 의심할 수가 있죠? 우리 대화도 많이 했잖아요...",
    "진짜 너무하시네요. 저는 당신을 믿었는데...",
    "마음이 너무 아파요. 제가 마피아처럼 보이나요?",
  ],
  cynic: [
    "맘대로 생각하세요. 어차피 믿지도 않을 거면서.",
    "참나, 여기서 제일 착한 척하는 사람이 범인인 거 몰라요?",
    "제가 마피아면 뭐 어쩔 건데요? 투표라도 하게요?",
  ],
};

export const previewCommands = [
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

export const previewActionGroups = [
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

export function getTitle(level: number) {
  if (level >= 10) return "마피아 헌터";
  if (level >= 7) return "심문 전문가";
  if (level >= 4) return "동네 추리왕";
  return "신입 탐정";
}
