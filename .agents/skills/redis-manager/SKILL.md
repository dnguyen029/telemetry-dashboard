---
name: redis-manager
description: Unified authority for local Redis L1 Bus interaction, state persistence, and real-time telemetry synchronization.
---

# Redis State Manager Skill

## 🎯 Overview
This skill provides the Swarm with sub-millisecond access to the **Layer 1: Local Bus (Redis)**. It is the primary mechanism for "Zero-Amnesia" state handoffs and real-time coordination between parallel lanes.

## 🛠️ Connection Details
- **Host**: `127.0.0.1`
- **Port**: `6379`
- **Auth**: Mandatory (Password found in `.env` as `REDIS_PASSWORD`)
- **Persistence**: AOF (Append Only File) Enabled

## 📜 Key Commands & Patterns

### 1. State Handoff (L1 Mirroring)
Before every filesystem commit, mirror the state to Redis:
```bash
redis-cli -a $REDIS_PASSWORD SET handoff:{session_id}:{agent} "{state_json}"
```

### 2. Session Heartbeat
Update the agent's presence on the bus:
```bash
redis-cli -a $REDIS_PASSWORD SETEX heartbeat:{agent} 60 "active"
```

### 3. Mission Telemetry
Push real-time observations to the shared bus:
```bash
redis-cli -a $REDIS_PASSWORD LPUSH mission:telemetry:{session_id} "{observation}"
```

## 🛡️ Guardrails
- **Max Memory**: 256MB (Enforced via `allkeys-lru`).
- **Data Expiry**: Always set TTLs for temporary handoffs to prevent keyspace pollution.
- **English Protocol**: All keys and value schemas MUST be in English.

## 📋 Integration
- **Primary Lane**: Lane 3 (Junior, Backend_Specialist, Browser_Subagent)
- **Role**: State Persistence & Real-time Sync.
