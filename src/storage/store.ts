import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Reminder, ReminderStatus, ReminderStore } from "./types.js";

const DATA_DIR = join(homedir(), ".nudge");
const DATA_FILE = join(DATA_DIR, "reminders.json");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): ReminderStore {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) {
    return { reminders: [] };
  }
  const raw = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as ReminderStore;
}

function writeStore(store: ReminderStore): void {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function createReminder(
  reminder: Omit<Reminder, "id" | "created" | "status" | "completed_at">
): Reminder {
  const store = readStore();
  const entry: Reminder = {
    id: crypto.randomUUID(),
    created: new Date().toISOString(),
    status: "active",
    completed_at: null,
    ...reminder,
  };
  store.reminders.push(entry);
  writeStore(store);
  return entry;
}

export function listReminders(options?: {
  status?: ReminderStatus;
  overdueOnly?: boolean;
}): Reminder[] {
  const store = readStore();
  const now = new Date();

  let results = store.reminders;

  if (options?.status) {
    results = results.filter((r) => r.status === options.status);
  }

  if (options?.overdueOnly) {
    results = results.filter(
      (r) => r.status === "active" && new Date(r.due) < now
    );
  }

  // Sort by due date ascending (most urgent first)
  results.sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime()
  );

  return results;
}

export function completeReminder(
  id: string
): { success: true; reminder: Reminder } | { success: false; error: string } {
  const store = readStore();
  const reminder = store.reminders.find((r) => r.id === id);

  if (!reminder) {
    return { success: false, error: `No reminder found with id: ${id}` };
  }

  if (reminder.status === "completed") {
    return { success: false, error: `Reminder is already completed` };
  }

  reminder.status = "completed";
  reminder.completed_at = new Date().toISOString();
  writeStore(store);

  return { success: true, reminder };
}
