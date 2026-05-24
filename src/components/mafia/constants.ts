import { DailyCase, PersonalityType, PersonalityTrait, Role } from "./types";

export const PROFILE_STORAGE_KEY = "mafia-chat-game:profile:v1";
export const MAX_HISTORY_ITEMS = 10;

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
    ],
    voteThreshold: 4,
  },
};

export const botNames = [
  "회색 후드", "낡은 시계", "검은 우산", "붉은 스카프", "푸른 노트", 
  "하얀 장갑", "무음 알림", "노란 장화", "초록 숲", "보라 연기",
  "조용한 그림자", "빠른 발걸음", "무거운 안경", "부드러운 미소", "차가운 시선"
];

export const personalityLines: Record<PersonalityType, string[]> = {
  logical: [
    "어젯밤 흐름을 분석해보면 조용했던 사람이 가장 확률이 높아요.",
    "너무 감정적인 호소는 오히려 논점을 흐릴 뿐입니다.",
    "발언 횟수가 적은 것보다, 발언의 내용이 어긋나는 게 핵심이죠.",
    "지금 누군가를 투표하려면 명확한 근거가 필요합니다.",
  ],
  aggressive: [
    "어물쩍 넘어가지 마세요. 수상한 냄새가 납니다.",
    "마피아가 아니면 왜 그렇게 당황하시죠?",
    "저는 이미 한 명을 점찍어 뒀습니다. 도망갈 생각 마세요.",
    "적극적으로 나서지 않는 사람은 마피아라고 봐도 무방해요.",
  ],
  timid: [
    "제 생각이 틀린 건 아닐까요? 무고한 시민을 잡을까 봐 겁나요.",
    "다들 조용히 계시니까 저도 말을 아끼게 되네요.",
    "혹시 제가 마피아의 타겟이 된 건 아닐지 걱정돼요.",
    "누구 한 명을 지목하는 게 마음이 편치 않네요.",
  ],
  emotional: [
    "왠지 모르게 저 사람의 눈빛이 흔들리는 것 같아요.",
    "서로 믿지 못하는 이 상황이 너무 슬프네요.",
    "직감이 말해주고 있어요. 우리 사이에 배신자가 있다고요.",
    "저를 끝까지 믿어줄 수 있는 분이 있을까요?",
  ],
};

export const personalityAnswers: Record<PersonalityType, Record<"citizen" | "mafia" | "power", string[]>> = {
  logical: {
    citizen: [
      "제 진술에 모순이 있는지 검토해 보세요. 저는 오직 승리를 위해 협력합니다.",
      "의심의 근거가 논리적이지 않네요. 다른 가능성도 고려해 보시죠.",
    ],
    mafia: [
      "제가 마피아라면 더 효율적인 동선으로 움직였을 겁니다. 분석이 틀렸네요.",
      "객관적인 데이터 없이 저를 몰아가는 건 시민 팀의 손해입니다.",
    ],
    power: [
      "제 역할에 대해서는 추론을 통해 결론을 내주시기 바랍니다. 보안이 중요하니까요.",
    ],
  },
  aggressive: {
    citizen: [
      "저를 의심할 시간에 진짜 범인이나 찾으시죠! 답답해 죽겠네요.",
      "제가 마피아였으면 당신부터 벌써 처리했을 겁니다.",
    ],
    mafia: [
      "지금 절 의심하는 당신이야말로 마피아 아니에요? 적반하장이네요.",
      "근거 없이 몰아세우지 마세요. 진짜 마피아는 당신 뒤에 있을걸요?",
    ],
    power: [
      "내 역할을 여기서 다 밝히라고요? 당신 마피아지?",
    ],
  },
  timid: {
    citizen: [
      "저... 정말 저는 아무것도 몰라요. 시민일 뿐이에요.",
      "왜 저한테만 그러세요... 무서워요.",
    ],
    mafia: [
      "제... 제가요? 전 그냥 가만히 있었는데... 오해하지 말아주세요.",
      "아무것도 기억나지 않아요. 밤에는 계속 눈을 감고 있었거든요.",
    ],
    power: [
      "아직은... 아직은 말할 때가 아니라고 생각해요. 죄송합니다.",
    ],
  },
  emotional: {
    citizen: [
      "우리가 서로 믿어야 마피아를 잡을 수 있어요. 제 진심을 알아주세요.",
      "저를 그렇게 보지 마세요. 마음이 너무 아프네요.",
    ],
    mafia: [
      "어떻게 저를 의심할 수가 있죠? 우리 대화도 많이 했잖아요.",
      "이런 분위기 정말 싫어요. 다들 너무 차갑네요.",
    ],
    power: [
      "제 느낌으로는... 제가 시민 팀의 중요한 열쇠가 될 것 같아요.",
    ],
  },
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
