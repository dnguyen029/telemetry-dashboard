---
name: database-design
description: Database design principles and decision-making.
category: database
version: 4.1.0-fractal
layer: master-skill
---

# Database Design

> **Learn to THINK, not copy SQL patterns.**

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

| File                              | Description                           | When to Read       |
| --------------------------------- | ------------------------------------- | ------------------ |
| `resources/database-selection.md` | PostgreSQL vs Neon vs Turso vs SQLite | Choosing database  |
| `resources/orm-selection.md`      | Drizzle vs Prisma vs Kysely           | Choosing ORM       |
| `resources/schema-design.md`      | Normalization, PKs, relationships     | Designing schema   |
| `resources/indexing.md`           | Index types, composite indexes        | Performance tuning |
| `resources/optimization.md`       | N+1, EXPLAIN ANALYZE                  | Query optimization |
| `resources/migrations.md`         | Safe migrations, serverless DBs       | Schema changes     |

---

## ⚠️ Core Principle

- ASK user for database preferences when unclear
- Choose database/ORM based on CONTEXT
- Don't default to PostgreSQL for everything

---

## Decision Checklist

Before designing schema:

- [ ] Asked user about database preference?
- [ ] Chosen database for THIS context?
- [ ] Considered deployment environment?
- [ ] Planned index strategy?
- [ ] Defined relationship types?

---

## Anti-Patterns

❌ Default to PostgreSQL for simple apps (SQLite may suffice)
❌ Skip indexing
❌ Use SELECT \* in production
❌ Store JSON when structured data is better
❌ Ignore N+1 queries
