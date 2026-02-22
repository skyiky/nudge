# nudge

Nudge is an MCP server that gives AI coding agents persistent, time-aware nudges. When you tell your agent "remind me to ship this by Friday," nudge stores that commitment and surfaces it at the start of future sessions based on urgency. A phone alarm is context-free and easy to dismiss. A nudge lives in your workspace, knows when you're overdue, and says so directly.

## How it works

Nudge exposes three tools over MCP:

- `nudge_set` creates a nudge with a message, ISO 8601 due date, and urgency level (low, medium, or high).
- `nudge_list` returns active nudges, sorted by due date, with overdue annotations. The companion skill calls this at session start.
- `nudge_complete` marks a nudge as done and records a completion timestamp.

Nudges are stored in `~/.nudge/nudges.json`. Completed nudges are kept, not deleted.

## Urgency levels

Urgency controls when and how the agent surfaces a nudge. You set it once at creation. It does not escalate.

| | Not yet due | Due today | Overdue |
|---|---|---|---|
| **low** | Silent | Silent | Brief mention |
| **medium** | Silent | Listed at session start | Listed, prompts for action |
| **high** | Silent | Leads the session | Leads the session, direct tone |

Low-urgency nudges are for things you want to not forget. High-urgency nudges are for hard commitments where the point is that you can't easily ignore them.

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

4. Add session-start trigger to `~/.config/opencode/AGENTS.md` (recommended):

```markdown
## Session Start

At the start of EVERY session, before responding to the user's first message, load the `nudge` skill and call `nudge_list` to check for due or overdue nudges. Surface them according to the skill's urgency rules. Subagents (agents launched via the Task tool) should NOT load the nudge skill or call `nudge_list`.
```

Without this step, the skill is installed but the agent won't reliably load it at session start. The `AGENTS.md` file provides instructions that run before every session.

## Storage

All data lives in `~/.nudge/nudges.json`. The file is created on first use. You can read, edit, or delete it directly.

## License

MIT
