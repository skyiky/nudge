export const URGENCY_LEVELS = ["low", "medium", "high"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export const REMINDER_STATUSES = ["active", "completed"] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface Reminder {
  id: string;
  message: string;
  created: string; // ISO 8601
  due: string; // ISO 8601
  urgency: Urgency;
  status: ReminderStatus;
  completed_at: string | null;
}

export interface ReminderStore {
  reminders: Reminder[];
}
