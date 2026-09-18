export type Thresholds = {
  autoFileNoul: number;
  highStakesMin: number;
  needsDecisionNoul: number;
  decideConfidence: number;
  waitingNoul: number;
  confirmConfidenceFloor: number;
  uncertainNoulLow: number;
  uncertainNoulHigh: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  autoFileNoul: 0.85,
  highStakesMin: 0.7,
  needsDecisionNoul: 0.7,
  decideConfidence: 0.6,
  waitingNoul: 0.7,
  confirmConfidenceFloor: 0.6,
  uncertainNoulLow: 0.4,
  uncertainNoulHigh: 0.6,
};

export const THRESHOLD_META: {
  key: keyof Thresholds;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "needsDecisionNoul",
    label: "Needs my decision",
    hint: "Noul at or above this sends the item to Decide now.",
    min: 0.5,
    max: 0.95,
    step: 0.05,
  },
  {
    key: "decideConfidence",
    label: "Decide confidence",
    hint: "Minimum Choice confidence before trusting bucket=decide.",
    min: 0.4,
    max: 0.9,
    step: 0.05,
  },
  {
    key: "waitingNoul",
    label: "Waiting on someone",
    hint: "Noul at or above this parks the item in Waiting.",
    min: 0.5,
    max: 0.95,
    step: 0.05,
  },
  {
    key: "autoFileNoul",
    label: "Safe to auto-file",
    hint: "Noul required before filing noise or low-stakes FYI.",
    min: 0.7,
    max: 0.98,
    step: 0.01,
  },
  {
    key: "highStakesMin",
    label: "High-stakes floor",
    hint: "Scores at or above this never auto-file.",
    min: 0.4,
    max: 1.5,
    step: 0.1,
  },
  {
    key: "confirmConfidenceFloor",
    label: "Confirm confidence floor",
    hint: "Bucket confidence below this goes to Confirm.",
    min: 0.4,
    max: 0.85,
    step: 0.05,
  },
];
