import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  createReminder,
  listReminders,
  completeReminder,
} from "../storage/store.js";
import { URGENCY_LEVELS } from "../storage/types.js";
import type { Reminder } from "../storage/types.js";

const server = new McpServer({
  name: "nudge",
  version: "0.1.0",
});

// --- Helpers ---

function formatReminder(r: Reminder): string {
  const now = new Date();
  const due = new Date(r.due);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let dueLabel: string;
  if (r.status === "completed") {
    dueLabel = `completed ${r.completed_at}`;
  } else if (diffDays < 0) {
    dueLabel = `OVERDUE by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
  } else if (diffDays === 0) {
    dueLabel = "DUE TODAY";
  } else if (diffDays === 1) {
    dueLabel = "due tomorrow";
  } else {
    dueLabel = `due in ${diffDays} days`;
  }

  return [
    `- [${r.urgency.toUpperCase()}] ${r.message}`,
    `  ${dueLabel} (due: ${r.due})`,
    `  id: ${r.id}`,
  ].join("\n");
}

// --- Tools ---

server.registerTool(
  "reminder_set",
  {
    description:
      "Create a new reminder. Use this when the user wants to be reminded about something — a commitment, deadline, or task they don't want to forget. The due date must be an ISO 8601 date string.",
    inputSchema: z.object({
      message: z.string().describe("What to be reminded about"),
      due: z
        .string()
        .describe(
          "When this is due, as an ISO 8601 date string (e.g. 2026-02-28T00:00:00Z). You must convert any natural language dates to ISO format before calling this tool."
        ),
      urgency: z
        .enum(URGENCY_LEVELS)
        .default("medium")
        .describe(
          "How aggressively to surface this reminder. low = passive (only mentioned when overdue), medium = listed at session start when due/overdue, high = leads the session when due/overdue"
        ),
    }),
  },
  async (input) => {
    const reminder = createReminder({
      message: input.message,
      due: input.due,
      urgency: input.urgency,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Reminder created.\n\n${formatReminder(reminder)}`,
        },
      ],
    };
  }
);

server.registerTool(
  "reminder_list",
  {
    description:
      "List reminders. Call this at the start of every session to check for due or overdue reminders. Can also be called when the user asks about their reminders.",
    inputSchema: z.object({
      status: z
        .enum(["active", "completed"])
        .optional()
        .describe(
          "Filter by status. Defaults to showing active reminders only."
        ),
      overdue_only: z
        .boolean()
        .optional()
        .describe("If true, only return overdue active reminders"),
    }),
  },
  async (input) => {
    const reminders = listReminders({
      status: input.status ?? "active",
      overdueOnly: input.overdue_only,
    });

    if (reminders.length === 0) {
      const qualifier = input.overdue_only
        ? "overdue "
        : input.status === "completed"
          ? "completed "
          : "";
      return {
        content: [
          {
            type: "text" as const,
            text: `No ${qualifier}reminders found.`,
          },
        ],
      };
    }

    const formatted = reminders.map(formatReminder).join("\n\n");
    const summary = `Found ${reminders.length} reminder${reminders.length === 1 ? "" : "s"}:\n\n${formatted}`;

    return {
      content: [
        {
          type: "text" as const,
          text: summary,
        },
      ],
    };
  }
);

server.registerTool(
  "reminder_complete",
  {
    description:
      "Mark a reminder as completed. Use this when the user has done what they committed to.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the reminder to complete"),
    }),
  },
  async (input) => {
    const result = completeReminder(input.id);

    if (!result.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to complete reminder: ${result.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Reminder completed.\n\n${formatReminder(result.reminder)}`,
        },
      ],
    };
  }
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
