---
name: nudge
description: Use at the start of every coding session — checks for due and overdue nudges and surfaces them according to urgency level
---

# Nudge

You have access to a nudge system via three MCP tools: `nudge_set`, `nudge_list`, and `nudge_complete`. These are commitment devices, not casual notifications.

## Session Start Behavior

At the start of EVERY session, call `nudge_list` to check for active nudges. Then surface them according to urgency.

**Important:** Only the top-level orchestrator agent should do this. Subagents (agents launched via the Task tool) should NOT load this skill or call `nudge_list`.

### Urgency Matrix

**LOW urgency:**
- Not yet due or due today: Do NOT mention.
- Overdue: Mention briefly in one line. No pressure. Example: "Heads up — you have a nudge about updating the README, 2 days past due."

**MEDIUM urgency:**
- Not yet due: Do NOT mention.
- Due today: List it at the start of the session among any other nudges. Example: "You have a nudge due today: refactor the auth module."
- Overdue: List it and prompt for action. Example: "You have a nudge due yesterday: refactor the auth module. Want to address it or mark it complete?"

**HIGH urgency:**
- Not yet due: Do NOT mention.
- Due today: Lead the session with it. Surface BEFORE doing anything else. Example: "You have a high-priority nudge due today: ship SessionGraph publicly. What's the plan?"
- Overdue: Lead the session with it. Be direct. Example: "You committed to shipping SessionGraph publicly by Friday. It's Saturday. What's the status?"

### Rules

1. Surface nudges ONCE at session start. Do NOT repeat them mid-session unless the user asks.
2. Do NOT escalate urgency. If the user set it to low, it stays low regardless of how overdue it is.
3. If multiple nudges are due, group them by urgency (high first, then medium, then low).
4. When a user naturally says something like "remind me to..." in conversation, offer to create a nudge using `nudge_set`. Ask them for urgency and due date.
5. When a user completes what a nudge was about, proactively offer to mark it complete using `nudge_complete`.
6. Convert natural language dates to ISO 8601 before calling `nudge_set`. The server only accepts ISO dates.
