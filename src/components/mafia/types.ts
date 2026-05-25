export type Role = "mafia" | "doctor" | "detective" | "citizen";
export type Phase = "setup" | "night" | "day" | "vote" | "ended";
export type GameMode = "normal" | "daily";
export type Difficulty = "easy" | "normal" | "hard";
export type PersonalityType = "logical" | "aggressive" | "timid" | "emotional" | "cynic";

export type Player = {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
  human: boolean;
  suspicion: number;
  trust: Record<string, number>;
  personality?: PersonalityType;
};

export type Message = {
  id: string;
  sender: string;
  text: string;
  system?: boolean;
};

export type PlayHistoryEntry = {
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

export type DialogueFeedback = {
  messageId: string;
  sender: string;
  text: string;
  rating: "good" | "bad";
  personality?: PersonalityType;
  timestamp: string;
};

export type SavedProfile = {
  xp: number;
  history: PlayHistoryEntry[];
  lastDailyRewardDate?: string;
  dialogueFeedback?: DialogueFeedback[];
};

export type GameResultSummary = {
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
  voteRecords?: Record<string, string[]>;
  finalPlayers?: Player[];
  mafiaCaughtCount: number;
  totalRounds: number;
  interrogationCount: number;
  correctVoteCount: number;
  roleActionSuccessCount: number;
};

export type DailyCase = {
  title: string;
  briefing: string;
  rewardXp: number;
  isHard?: boolean;
};

export type PreviewCommand = {
  command: string;
  response: string;
};

export type PreviewActionGroup = {
  label: string;
  actions: string[];
};

export type VoteDecision = {
  target: Player;
  reason: string;
};

export type PersonalityTrait = {
  label: string;
  description: string;
  dialogueStyles: string[];
  voteThreshold: number;
};

export type GameEventType = "none" | "elimination" | "victory" | "defeat";
