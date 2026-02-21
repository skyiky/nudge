import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  createNudge,
  listNudges,
  completeNudge,
} from "../storage/store.js";
import { URGENCY_LEVELS } from "../storage/types.js";
import type { Nudge } from "../storage/types.js";

const server = new McpServer({
  name: "nudge",
  version: "0.1.0",
});

// --- Helpers ---

function formatNudge(n: Nudge): string {
  const now = new Date();
  const due = new Date(n.due);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let dueLabel: string;
  if (n.status === "completed") {
    dueLabel = `completed ${n.completed_at}`;
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
    `- [${n.urgency.toUpperCase()}] ${n.message}`,
    `  ${dueLabel} (due: ${n.due})`,
    `  id: ${n.id}`,
  ].join("\n");
}

// --- Tools ---

server.registerTool(
  "nudge_set",
  {
    description:
      "Create a new nudge. Use this when the user wants to be reminded about something — a commitment, deadline, or task they don't want to forget. The due date must be an ISO 8601 date string.",
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
          "How aggressively to surface this nudge. low = passive (only mentioned when overdue), medium = listed at session start when due/overdue, high = leads the session when due/overdue"
        ),
    }),
  },
  async (input) => {
    const nudge = createNudge({
      message: input.message,
      due: input.due,
      urgency: input.urgency,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Nudge created.\n\n${formatNudge(nudge)}`,
        },
      ],
    };
  }
);

server.registerTool(
  "nudge_list",
  {
    description:
      "List nudges. Call this at the start of every session to check for due or overdue nudges. Can also be called when the user asks about their nudges.",
    inputSchema: z.object({
      status: z
        .enum(["active", "completed"])
        .optional()
        .describe(
          "Filter by status. Defaults to showing active nudges only."
        ),
      overdue_only: z
        .boolean()
        .optional()
        .describe("If true, only return overdue active nudges"),
    }),
  },
  async (input) => {
    const nudges = listNudges({
      status: input.status ?? "active",
      overdueOnly: input.overdue_only,
    });

    if (nudges.length === 0) {
      const qualifier = input.overdue_only
        ? "overdue "
        : input.status === "completed"
          ? "completed "
          : "";
      return {
        content: [
          {
            type: "text" as const,
            text: `No ${qualifier}nudges found.`,
          },
        ],
      };
    }

    const formatted = nudges.map(formatNudge).join("\n\n");
    const summary = `Found ${nudges.length} nudge${nudges.length === 1 ? "" : "s"}:\n\n${formatted}`;

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
  "nudge_complete",
  {
    description:
      "Mark a nudge as completed. Use this when the user has done what they committed to.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the nudge to complete"),
    }),
  },
  async (input) => {
    const result = completeNudge(input.id);

    if (!result.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to complete nudge: ${result.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Nudge completed.\n\n${formatNudge(result.nudge)}`,
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
