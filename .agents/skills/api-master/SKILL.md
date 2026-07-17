---
name: api-master
description: Unified authority for REST/GraphQL design, documentation, and implementation patterns.
version: 1.0.0
category: development
---

# 🌐 API Master Skill

Unified authority for designing, documenting, and implementing high-performance APIs.

## 🎯 Core Principles

1. **Developer First**: APIs must be intuitive, predictable, and self-documenting.
2. **Resource-Oriented**: Use standard HTTP methods and status codes correctly.
3. **Strict Versioning**: Protect consumers from breaking changes via URI or Header versioning.
4. **Security by Design**: Implement OIDC/JWT, rate limiting, and input sanitization natively.

## 🧩 Key Patterns

- **Pagination**: Use cursor-based pagination for large datasets.
- **Errors**: Return consistent RFC 7807 problem details.
- **Filtering**: Use standardized query params (`?filter[field]=value`).
- **HATEOAS**: Provide navigation links in responses for discovery.

## 📄 Documentation (OpenAPI 3.1)

- Every endpoint MUST have a clear description and example payload.
- Use `context7` to verify latest OpenAPI compliance patterns.
- Automated generation via `api-documentation-generator` (integrated).

## 🛠️ Implementation Playbook

1. Define the Resource Model.
2. Draft the OpenAPI spec.
3. Validate with consumers.
4. Implement with TDD (Test-Driven Development).
