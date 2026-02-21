export const URGENCY_LEVELS = ["low", "medium", "high"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export const NUDGE_STATUSES = ["active", "completed"] as const;
export type NudgeStatus = (typeof NUDGE_STATUSES)[number];

export interface Nudge {
  id: string;
  message: string;
  created: string; // ISO 8601
  due: string; // ISO 8601
  urgency: Urgency;
  status: NudgeStatus;
  completed_at: string | null;
}

export interface NudgeStore {
  nudges: Nudge[];
}
