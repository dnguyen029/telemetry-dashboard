# 📋 Antigravity 2.0: Daily Swarm Workflow Cheat Sheet

Welcome to your clean Antigravity 2.0 workspace! This is a simple, no-code guide to help you interact with your agent team, tag specialists, and use commands in your daily workflow.

\*Back to **[Workspace Dashboard](file:///home/dnguyen029/telemetry-dashboard/.agents/docs/dashboard.md)\***

---

## 🗣️ Option 1: Direct Chat (No Tags)

If you type in the chat box without tagging anyone, you are chatting directly with the **Principal Agent**.

> **When to use**:
>
> - General questions (_"why did my build fail?"_)
> - Lightweight tasks or fast edits (_"clean up my background tasks"_ or _"check my CPU status"_)
> - Asking for explanations in plain English.

---

## 🏷️ Option 2: Tagging Specialists

For structured tasks, you can summon a specific agent by tagging them (e.g. typing `@builder`). The IDE will load their specific instructions and tools.

| Agent Tag / Role    | Focus Area                                                                                   | Example Request                                               |
| :------------------ | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| **`@orchestrator`** | Designs plans, evaluates task scope, drafts specifications. _(Prohibited from writing code)_ | `@orchestrator design a new CRM integration plan.`            |
| **`@builder`**      | Writes/edits Python code, creates APIs, runs syntax checks.                                  | `@builder add a sentiment column to tools/sheets.py.`         |
| **`@auditor`**      | Reviews plans/edits for safety, scans for keys, verifies syntax.                             | `@auditor check the recent code edits for safety.`            |
| **`@sre`**          | Manages environment variables, configurations, and deployment health.                        | `@sre verify the Supabase database connection.`               |
| **`@researcher`**   | Investigates errors, queries past lessons, conducts Exa web searches.                        | `@researcher look up the error code from our build logs.`     |
| **`@librarian`**    | Documents changes in walkthroughs, archives lessons, syncs session logs.                     | `@librarian synchronize our active findings to the database.` |

---

## ⌨️ Option 3: Slash Commands

Type `/` in the chat input bar to trigger automated shortcuts.

- **`/goal` (Deep Focus Mode)**: Use this for long-running, complex goals (like building a feature overnight) where you want the agent to work thoroughly without stopping.
- **`/grill-me` (Alignment Interview)**: Use this when you aren't sure how to design something. The agent will ask you a few simple multiple-choice questions to build the perfect plan.

---

## 🔌 Pre-Flight Check

To verify the health and connectivity of the tool servers (Exa, Supabase, TOON, Context MCP), run the connection verifier. Refer to **[bootstrap.md](file:///home/dnguyen029/telemetry-dashboard/bootstrap.md)** for execution details.

---

## ⚡ Swarm Orchestration (/orchestrate)

The terminal-based Python script `native_orchestrator.py` has been decoupled and resides in the external **`antigravity-sdk`** repository (sibling directory). It is not executed within this IDE workspace environment.

For swarm tasks and multi-agent coordination, use the **IDE Swarm Orchestrator**:

- Type `/orchestrate <goal>` in the chat input bar.
- This triggers the full multi-agent workflow (Discovery, Planning & Root Cause Analysis, Execution, and Verification) directly within the IDE.
