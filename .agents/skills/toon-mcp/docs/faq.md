---
layout: default
title: TOON Format FAQ - Common Questions About Token Optimization
description: Frequently asked questions about TOON format, JSON to TOON conversion, token optimization, and MCP server integration. Get answers to common TOON questions.
keywords: TOON FAQ, TOON format questions, token optimization FAQ, JSON compression questions, TOON answers
---

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is TOON format?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TOON (Token-Optimized Object Notation) is a JSON-based compression format designed to reduce AI token consumption by 40-60%. It applies key abbreviation, schema-based array encoding, and value compaction while maintaining 100% lossless round-trip conversion."
      }
    },
    {
      "@type": "Question",
      "name": "How much can I reduce tokens with TOON?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TOON typically reduces estimated token usage by 40-60% for API array responses, 50-65% for database record arrays, 35-50% for configuration objects, and 30-45% for log data. Actual savings depend on array size and key verbosity."
      }
    },
    {
      "@type": "Question",
      "name": "Is TOON format lossless?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, TOON is 100% lossless. All data is perfectly preserved and can be converted back to original JSON with exact fidelity, including in aggressive mode which stores custom abbreviations in the _custom_keys field."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use TOON with Claude?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. TOON-MCP is a Model Context Protocol server that integrates directly with Claude Desktop and Claude Code. It exposes six tools (convert_to_toon, convert_to_json, analyze_patterns, get_compression_strategy, calculate_savings, batch_convert) and two resources."
      }
    },
    {
      "@type": "Question",
      "name": "How do I install TOON-MCP?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Clone the repository, run pip install -e mcp-server-toon/ from the repo root, then add the server to your MCP configuration with command: python, args: [\"-m\", \"src.server\"], and cwd pointing to the mcp-server-toon/ directory."
      }
    }
  ]
}
</script>

# Frequently Asked Questions

---

## General Questions

### What is TOON format?

**TOON (Token-Optimized Object Notation)** is a JSON-based compression format designed for AI development workflows. It reduces token consumption by 40–60% through key abbreviation and schema-based array encoding, with 100% lossless round-trip conversion.

[Learn more →]({{ '/what-is-toon' | relative_url }})

---

### Is "TOON" the same as Token-Oriented Object Notation?

No. A separate community format called **Token-Oriented Object Notation** (different name expansion, same acronym) also emerged around late 2025. That format uses a text/indentation-based encoding similar to YAML-meets-CSV. This project's TOON uses a JSON-in-JSON envelope (`{"_toon":"1.0","d":...}`) and is architecturally distinct. The wire formats are syntactically incompatible — no parser would confuse them.

---

### How much can I reduce tokens with TOON?

Token counts are estimated at 4 characters per token.

| Data type | Typical savings |
|---|---|
| API response arrays | 40–60% |
| Database record arrays | 50–65% |
| Config objects | 35–50% |
| Log/event arrays | 30–45% |

Savings scale with array length and key verbosity. A single 3-field object may only save 10–15%; a 100-row result set with long keys can exceed 60%.

[See real examples →]({{ '/examples' | relative_url }})

---

### Is TOON format lossless?

**Yes, 100% lossless.** Every conversion can be reversed to produce the exact original JSON, including when aggressive mode is used (custom abbreviations are stored in `_custom_keys` inside the payload).

---

## Technical Questions

### Can I use TOON with Claude?

TOON-MCP integrates directly with Claude via the Model Context Protocol. Add it to your MCP config and six tools become available: `convert_to_toon`, `convert_to_json`, `analyze_patterns`, `get_compression_strategy`, `calculate_savings`, and `batch_convert`.

---

### Can I use TOON with ChatGPT or other LLMs?

Yes, with any LLM. The MCP integration is Claude-specific, but you can call the Python library directly and paste the TOON output into any conversation:

```python
from src.toon_converter import convert_json_to_toon, convert_toon_to_json

# Compress before sharing
toon = convert_json_to_toon(api_response)

# Restore when processing
import json
original = json.loads(convert_toon_to_json(toon))
```

---

### How do I convert JSON to TOON?

**Three ways:**

1. **Python library:**
```python
from src.toon_converter import convert_json_to_toon
toon = convert_json_to_toon(your_data)
```

2. **MCP tool** (in Claude):
```
Use the convert_to_toon tool with your JSON string
```

3. **Auto-converter CLI:**
```bash
python claude-code-integration/auto_converter.py ./src --dry-run
```

[Full setup →]({{ '/guides/setup' | relative_url }})

---

### What data does TOON compress best?

**Best compression:**
- Arrays where all objects share the same key set (schema compression kicks in)
- Data with long, verbose key names like `created_at`, `metadata`, `configuration`
- Large payloads (> ~100 estimated tokens)

**Least compression:**
- Single small objects — the `{"_toon":"1.0","d":...}` envelope has fixed overhead
- Data with very short, unique keys
- Already minimal JSON

---

### What are standard vs aggressive mode?

**Standard mode** (`aggressive=False`, the default) abbreviates keys using the built-in `KEY_ABBREV` table and applies schema compression to uniform arrays. Keys not in the table are kept verbatim.

**Aggressive mode** (`aggressive=True`) additionally auto-abbreviates domain-specific keys that appear 2+ times and are not in `KEY_ABBREV`. Custom abbreviations are stored in `_custom_keys` in the payload — decompression is still automatic and lossless.

Aggressive mode helps most on heterogeneous objects with repeated long domain keys. For uniform arrays already handled by schema compression, aggressive mode adds `_custom_keys` overhead without benefit.

```python
from src.toon_converter import TOONConverter

# Standard
toon_std = TOONConverter().json_to_toon(data)

# Aggressive — auto-abbreviates domain keys like 'transaction_id'
toon_agg = TOONConverter(aggressive=True).json_to_toon(data)
```

---

### Can I add my own key abbreviations?

Yes — edit `src/config.py` and add entries to `KEY_ABBREV`:

```python
KEY_ABBREV = {
    # built-in entries ...
    'transaction_id':   'txid',
    'account_number':   'acct',
    'product_category': 'pcat',
}
```

The reverse map (`ABBREV_KEY`) is derived automatically from `KEY_ABBREV` at import time. No other changes are needed.

Alternatively, `PatternDetector.suggest_custom_abbreviations()` will analyze your data and suggest abbreviations for frequently occurring long keys:

```python
from src.patterns import PatternDetector

detector = PatternDetector()
detector.analyze(your_data)
print(detector.suggest_custom_abbreviations())
# {'product_name': 'prdn', 'product_type': 'prdt', ...}
```

---

## Installation

### How do I install TOON-MCP?

```bash
git clone https://github.com/aj-geddes/toon-context-mcp.git
cd toon-context-mcp/mcp-server-toon
pip install -e .
```

Then add to your Claude MCP config:

```json
{
  "mcpServers": {
    "toon": {
      "command": "python",
      "args": ["-m", "src.server"],
      "cwd": "/absolute/path/to/toon-context-mcp/mcp-server-toon"
    }
  }
}
```

[Complete setup guide →]({{ '/guides/setup' | relative_url }})

---

### What's the difference between TOON and minified JSON?

| Feature | TOON | Minified JSON |
|---|---|---|
| Removes whitespace | Yes | Yes |
| Abbreviates key names | Yes | No |
| Schema-encodes arrays | Yes | No |
| Token reduction | 40–60% | ~5–10% |
| Requires decoder | Yes | No |
| Lossless | Yes | Yes |

Minification only removes whitespace; TOON compresses the structure itself.

---

## Token Savings

### How are token savings calculated?

`calculate_savings` estimates token counts at **4 characters per token** (matching the `CHARS_PER_TOKEN` constant in `src/config.py`). This is a rough approximation — actual tokenization depends on the model and tokenizer. Both character counts and estimated token counts are returned:

```python
savings = converter.calculate_savings(original_json, toon)
# {
#   'original_chars':   142,
#   'toon_chars':       68,
#   'original_tokens':  35,   # original_chars // 4
#   'toon_tokens':      17,   # toon_chars // 4
#   'tokens_saved':     18,
#   'savings_percent':  51.43,
#   'compression_ratio':0.479
# }
```

For exact token counts, use `tiktoken`:
```bash
pip install tiktoken
```

---

## Troubleshooting

### My TOON conversion isn't saving many tokens

1. **Data size:** Objects with fewer than 50 tokens see minimal benefit from the fixed envelope overhead.
2. **Key names:** If your keys are already short, abbreviation gains are small.
3. **Array structure:** Heterogeneous arrays (objects with varying keys) can't use schema compression — try aggressive mode.
4. **Run pattern analysis** to understand what's compressible:

```python
from src.patterns import PatternDetector
detector = PatternDetector()
for p in detector.analyze(your_data):
    print(p.pattern_type, p.confidence)
```

[Troubleshooting guide →]({{ '/guides/troubleshooting' | relative_url }})

---

### Can I convert TOON back to JSON?

**Yes, always:**

```python
from src.toon_converter import convert_toon_to_json
import json

original = json.loads(convert_toon_to_json(toon_string))
```

This works for both standard and aggressive-mode payloads. The `_custom_keys` field is handled automatically during decompression.

---

### Is TOON open source?

**Yes.** TOON-MCP is MIT licensed — free for commercial use, modification, and distribution.

[View on GitHub →](https://github.com/aj-geddes/toon-context-mcp)

---

## Getting Started

**Three-step path:**

1. **[What is TOON?]({{ '/what-is-toon' | relative_url }})** — Understand the format (5 min)
2. **[Setup Guide]({{ '/guides/setup' | relative_url }})** — Install TOON-MCP (5 min)
3. **[Examples]({{ '/examples' | relative_url }})** — See real before/after comparisons (10 min)

---

Still have questions?
- **[GitHub Discussions](https://github.com/aj-geddes/toon-context-mcp/discussions)** — Ask the community
- **[GitHub Issues](https://github.com/aj-geddes/toon-context-mcp/issues)** — Report bugs
- **[Troubleshooting Guide]({{ '/guides/troubleshooting' | relative_url }})** — Common problems

---

<div class="alert alert-success">
<strong>Ready to reduce your token usage?</strong><br>
Install TOON-MCP in 5 minutes and start compressing JSON in your AI workflows.<br><br>
<a href="{{ '/guides/setup' | relative_url }}" class="btn">Get Started</a>
</div>
