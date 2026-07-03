import type { CategorySnapshot, Difficulty } from "@/features/categories/categoryTypes";

export type TimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "finishing"
  | "finished";

export type GameStatus = "active" | "finished";

export type PlayStage =
  | "prepare"
  | "letter-draw"
  | "ready"
  | "running"
  | "finishing"
  | "scoring"
  | "round-complete";

export type Player = {
  id: string;
  name: string;
  colorIndex: number;
  createdAt: string;
};

export type ScoreEntry = {
  total: number;
  additions: number[];
};

export type Round = {
  id: string;
  number: number;
  letter: string | null;
  categorySnapshot: CategorySnapshot[];
  scores: Record<string, ScoreEntry>;
  confirmedPlayerIds: string[];
  durationSeconds: number;
  finishCountdownSeconds: number;
  status: "setup" | "running" | "finished";
  createdAt: string;
  finishedAt: string | null;
};

export type TimerState = {
  status: TimerStatus;
  configuredDurationSeconds: number;
  configuredFinishSeconds: number;
  remainingSeconds: number;
  endsAt: number | null;
  pausedPhase: "round" | "finish" | null;
};

export type CategoryDrawSettings = {
  basic: number;
  classic: number;
  medium: number;
  hard: number;
  advanced: number;
};

export type AlphabetSettings = {
  enabledLetters: string[];
  defaultLetters: string[];
};

export type RankingEntry = {
  playerId: string;
  playerName: string;
  colorIndex: number;
  total: number;
  place: number;
  isTied: boolean;
};

export type GameState = {
  id: string;
  status: GameStatus;
  players: Player[];
  rounds: Round[];
  activeRoundId: string;
  selectedCategories: CategorySnapshot[];
  lockedCategoryIds: string[];
  currentDrawnLetter: string | null;
  usedLetters: string[];
  alphabetSettings: AlphabetSettings;
  categoryDrawSettings: CategoryDrawSettings;
  timer: TimerState;
  soundEnabled: boolean;
  createdAt: string;
  finishedAt: string | null;
};

export type DifficultyCounts = Record<Difficulty, number>;
