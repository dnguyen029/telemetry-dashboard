# 🛸 Antigravity 2.0 IDE Swarm Workspace Dashboard

This repository serves as the **Antigravity 2.0 IDE Swarm Workspace**. It is the central configuration and governance repository that manages our developer agent swarm. 

### 🗄️ Workspace Architecture
Our systems are organized as follows:
1. **This Workspace Repository (`antigravity-project`):** Main repository hosting developer agent configurations, IDE rules, MCP setups, and connection verifiers.
2. **AI Receptionist Production Codebase:** Hosted right inside this repository under the [app_build/receptionist/](file:///home/dnguyen029/telemetry-dashboard/app_build/receptionist/) directory. This contains the FastAPI webhook backend deployed to **Google Cloud Run** in project `arielcsx` as service `receptionist-prod` (`us-central1`), with base URL `https://receptionist-prod-106093400023.us-central1.run.app`.
3. **Python SDK Swarm Repository ([`antigravity-sdk`](https://github.com/dnguyen029/antigravity-sdk.git)):** Hosts the underlying Google Antigravity SDK (`google.adk`) code and Python backend CLI.

---

## 🏛️ Governance & Safety Rules
*   [Swarm Safety Guardrails](file:///home/dnguyen029/telemetry-dashboard/guardrails.md): Mandatory execution boundaries, budget controls, and safety constraints.
*   [Swarm Agent Roles](file:///home/dnguyen029/telemetry-dashboard/.agents/rules/AGENTS.md): Profiles and authority mappings for our Orchestrator, Builder, Auditor, and Librarian agents.

## 📋 Standard Operating Procedures (SOPs)
*   [Ariel Bath Receptionist SOP](file:///home/dnguyen029/telemetry-dashboard/.agents/docs/RECEPTIONIST_SOP.md): Standard workflows for handling customer routing, WISMO, and Lead Logging.
*   [Daily Development Lifecycle](file:///home/dnguyen029/telemetry-dashboard/.agents/docs/DAILY_WORKFLOW.md): Core workflow phases from Discovery to Verification.

## 🗺️ Project Architecture
*   [Domain Mapping](file:///home/dnguyen029/telemetry-dashboard/.agents/docs/DOMAIN_MAP.md): Structural layout of files, folders, and component domains.
*   [Ripple Map](file:///home/dnguyen029/telemetry-dashboard/.agents/docs/RIPPLE_MAP.md): Dependencies and cross-component impact matrices.
*   [System Status Report](file:///home/dnguyen029/telemetry-dashboard/production_artifacts/system_status_report.md): Latest system audit logs and health checks.

---

## ⚡ Task Board
*   [Task Tracking](file:///home/dnguyen029/telemetry-dashboard/production_artifacts/task.md): Interactive checklists of our active sprint items.
*   [Walkthrough History](file:///home/dnguyen029/telemetry-dashboard/production_artifacts/walkthrough.md): Detailed records of implemented changes and verification logs.
*   [Live Swarm Monitor](file:///home/dnguyen029/telemetry-dashboard/production_artifacts/agent_live.md): Real-time visual tracking of active agents and phases.

