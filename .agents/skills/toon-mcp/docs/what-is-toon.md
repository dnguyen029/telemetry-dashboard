---
layout: default
title: What is TOON Format? Token-Optimized Object Notation Explained
description: Learn what TOON format is, how it works, and why it reduces AI token usage by up to 60%. Complete guide to Token-Optimized Object Notation for developers.
keywords: what is TOON, TOON format explained, token optimized object notation, TOON definition, how TOON works, token compression format
---

# What is TOON Format?

**TOON (Token-Optimized Object Notation)** is a JSON-based compression format designed to reduce token consumption in AI-assisted development workflows. It encodes JSON data in a compact envelope that preserves 100% of the original structure, enabling lossless round-trip conversion.

<div class="alert alert-info">
<strong>Naming note</strong><br>
A separate community format also called "TOON" — <em>Token-Oriented Object Notation</em> — exists (toon-format/spec on GitHub, provisional IANA type <code>text/toon</code>). That format uses a text/indentation-based encoding, not JSON. This project's wire format is JSON-in-JSON and is architecturally distinct. No parser would confuse the two.
</div>

## The Problem TOON Solves

When working with Claude, ChatGPT, or other LLMs, developers frequently run into:

- **Token limit constraints** that truncate important context
- **High API costs** from verbose JSON payloads
- **Slower response times** from large data transfers
- **Lost conversation history** when context windows fill up

Standard JSON is human-readable but verbose for AI consumption. A typical API response can consume 40–60% more tokens than necessary simply due to long key names and whitespace.

## How TOON Works

TOON applies three compression strategies, in order of impact:

### 1. Schema-Based Array Encoding (highest impact)

When all objects in an array share identical keys, TOON encodes them once as a schema and stores only the values in rows:

```json
[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
```
becomes:
```json
{"_sch": ["i", "n"], "_dat": [[1, "Alice"], [2, "Bob"]]}
```

This eliminates repeated key strings entirely. For 100-item arrays it often accounts for 40–55% of total savings.

### 2. Key Abbreviation

Common keys are replaced with short codes using a built-in lookup table (`KEY_ABBREV` in `src/config.py`):

| Original key | Abbreviated |
|---|---|
| `id` | `i` |
| `name` | `n` |
| `status` | `s` |
| `metadata` | `meta` |
| `created_at` | `ca` |
| `updated_at` | `ua` |
| `email` | `eml` |

### 3. Value Compaction

Null, true, and false are encoded as single characters:

| Value | TOON |
|---|---|
| `null` | `"~"` |
| `true` | `"T"` |
| `false` | `"F"` |

### Aggressive Mode

When `TOONConverter(aggressive=True)` is used, the converter additionally auto-abbreviates domain-specific keys that appear 2+ times but are not in the built-in `KEY_ABBREV` table. Custom abbreviations are stored in a `_custom_keys` field in the payload so decompression is always lossless.

This mode is most effective for heterogeneous objects with long repeated keys (e.g., `customer_first_name`, `transaction_status`). For uniform arrays that already use schema compression, aggressive mode provides no additional benefit because each key appears only once.

## Example: Before and After

**Standard JSON** (~35 tokens):
```json
{
  "id": 12345,
  "name": "John Doe",
  "email": "john@example.com",
  "type": "user",
  "status": "active",
  "metadata": {
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**TOON Format** (~17 tokens, ~52% reduction):
```json
{"_toon":"1.0","d":{"i":12345,"n":"John Doe","eml":"john@example.com","t":"user","s":"active","meta":{"ca":"2025-01-01T00:00:00Z","ua":"2025-01-15T10:30:00Z"}}}
```

## The TOON Wire Format

```json
{
  "_toon": "1.0",
  "d": { },
  "_refs": { },
  "_custom_keys": { }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `_toon` | Yes | Version identifier |
| `d` | Yes | Compressed data payload |
| `_refs` | No | Value reference expansion map (`@key` strings) |
| `_custom_keys` | No | Present only in aggressive-mode output; maps original keys → short forms |

The output is always valid JSON, so any JSON-compatible tool can process it after calling `convert_toon_to_json`.

## Typical Savings

Token counts are estimated at 4 characters per token.

| Data type | Typical savings |
|---|---|
| API responses (arrays) | 40–60% |
| Database record arrays | 50–65% |
| Configuration objects | 35–50% |
| Heterogeneous log arrays | 30–45% |

Savings scale with array length and key verbosity. A single 3-field object may save only 10–15%; a 100-row result set with long keys can exceed 60%.

## When to Use TOON

**Good fit:**
- Arrays of objects returned from APIs or databases
- Large JSON payloads that consume significant context
- Tool outputs you want to store efficiently in a conversation
- Data-heavy MCP integrations

**Poor fit:**
- Single small objects (<50 tokens) — overhead of the envelope outweighs savings
- Data that needs to stay human-readable in place
- Binary or already-compressed payloads

## Getting Started

1. **[Setup Guide]({{ '/guides/setup' | relative_url }})** — Install in 5 minutes
2. **[User Guide]({{ '/guides/user-guide' | relative_url }})** — Usage patterns and best practices
3. **[Examples]({{ '/examples' | relative_url }})** — Real-world before/after comparisons

---

<div class="alert alert-info">
<strong>Open Source</strong><br>
TOON-MCP is MIT licensed. Source: <a href="https://github.com/aj-geddes/toon-context-mcp">github.com/aj-geddes/toon-context-mcp</a>
</div>
