import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Nudge, NudgeStatus, NudgeStore } from "./types.js";

const DATA_DIR = join(homedir(), ".nudge");
const DATA_FILE = join(DATA_DIR, "nudges.json");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): NudgeStore {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) {
    return { nudges: [] };
  }
  const raw = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as NudgeStore;
}

function writeStore(store: NudgeStore): void {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function createNudge(
  nudge: Omit<Nudge, "id" | "created" | "status" | "completed_at">
): Nudge {
  const store = readStore();
  const entry: Nudge = {
    id: crypto.randomUUID(),
    created: new Date().toISOString(),
    status: "active",
    completed_at: null,
    ...nudge,
  };
  store.nudges.push(entry);
  writeStore(store);
  return entry;
}

export function listNudges(options?: {
  status?: NudgeStatus;
  overdueOnly?: boolean;
}): Nudge[] {
  const store = readStore();
  const now = new Date();

  let results = store.nudges;

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

export function completeNudge(
  id: string
): { success: true; nudge: Nudge } | { success: false; error: string } {
  const store = readStore();
  const nudge = store.nudges.find((r) => r.id === id);

  if (!nudge) {
    return { success: false, error: `No nudge found with id: ${id}` };
  }

  if (nudge.status === "completed") {
    return { success: false, error: `Nudge is already completed` };
  }

  nudge.status = "completed";
  nudge.completed_at = new Date().toISOString();
  writeStore(store);

  return { success: true, nudge };
}
