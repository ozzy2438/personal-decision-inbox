export const BUCKETS = [
  "decide",
  "fyi",
  "noise",
  "waiting",
  "commitment",
] as const;

export const DOMAINS = [
  "work",
  "personal",
  "money",
  "health",
  "legal",
  "social",
  "other",
] as const;

export const QUEUES = ["decide", "confirm", "waiting", "filed"] as const;

export type Bucket = (typeof BUCKETS)[number];
export type Domain = (typeof DOMAINS)[number];
export type Queue = (typeof QUEUES)[number];

export type SourceKind =
  | "email"
  | "calendar"
  | "slack"
  | "meeting"
  | "paste"
  | "demo";

export type ItemState = {
  source: SourceKind;
  title: string;
  body: string;
  from?: string;
  receivedAt?: string;
  participants?: string[];
  demoId?: string;
};

export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};

export type NoulAnswer = {
  type: "noul";
  noul: number;
};

export type ScoreAnswer = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};

export type Answers = {
  bucket: ChoiceAnswer;
  needs_my_decision: NoulAnswer;
  needs_reply: NoulAnswer;
  is_time_sensitive: NoulAnswer;
  waiting_on_other: NoulAnswer;
  safe_to_auto_file: NoulAnswer;
  domain: ChoiceAnswer;
  stakes: ScoreAnswer;
  urgency: ScoreAnswer;
};

export type EvaluationMode = "fixture" | "live";

export type PolicyResult = {
  queue: Queue;
  recommendedAction: string;
  reason: string;
};

export type Evaluation = {
  answers: Answers;
  policy: PolicyResult;
  mode: EvaluationMode;
};

export type HumanAction =
  | "decide"
  | "confirm"
  | "snooze"
  | "delegate"
  | "undo_file"
  | "ingest"
  | "refile"
  | "load_demo";

export type InboxItem = {
  id: string;
  state: ItemState;
  answers: Answers;
  queue: Queue;
  recommendedAction: string;
  policyReason: string;
  createdAt: string;
  updatedAt: string;
  snoozeUntil?: string;
  decision?: string;
  delegateTo?: string;
  resolvedAt?: string;
  evaluationMode: EvaluationMode;
};

export type AuditRow = {
  id: string;
  itemId: string;
  action: HumanAction;
  at: string;
  detail?: string;
};
