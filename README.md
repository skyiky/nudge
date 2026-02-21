# nudge

Nudge is an MCP server that gives AI coding agents persistent, time-aware reminders. When you tell your agent "remind me to ship this by Friday," nudge stores that commitment and surfaces it at the start of future sessions based on urgency. A phone alarm is context-free and easy to dismiss. A nudge lives in your workspace, knows when you're overdue, and says so directly.

## How it works

Nudge exposes three tools over MCP:

- `reminder_set` creates a reminder with a message, ISO 8601 due date, and urgency level (low, medium, or high).
- `reminder_list` returns active reminders, sorted by due date, with overdue annotations. The companion skill calls this at session start.
- `reminder_complete` marks a reminder as done and records a completion timestamp.

Reminders are stored in `~/.nudge/reminders.json`. Completed reminders are kept, not deleted.

## Urgency levels

Urgency controls when and how the agent surfaces a reminder. You set it once at creation. It does not escalate.

| | Not yet due | Due today | Overdue |
|---|---|---|---|
| **low** | Silent | Silent | Brief mention |
| **medium** | Silent | Listed at session start | Listed, prompts for action |
| **high** | Silent | Leads the session | Leads the session, direct tone |

Low-urgency reminders are for things you want to not forget. High-urgency reminders are for hard commitments where the point is that you can't easily ignore them.

## Setup

Requires [Bun](https://bun.sh) and an MCP-compatible client (e.g. [OpenCode](https://opencode.ai)).

1. Clone and install:

```bash
git clone https://github.com/skyiky/nudge.git
cd nudge && bun install
```

2. Add to your MCP client config (OpenCode example — `~/.config/opencode/opencode.json`):

```json
{
  "mcp": {
    "nudge": {
      "type": "local",
      "command": ["bun", "run", "/path/to/nudge/src/mcp/server.ts"],
      "enabled": true
    }
  }
}
```

3. Install the companion skill (optional, for session-start behavior):

```bash
cp -r skills/nudge ~/.config/opencode/skills/nudge
```

## Storage

All data lives in `~/.nudge/reminders.json`. The file is created on first use. You can read, edit, or delete it directly.

## License

MIT
