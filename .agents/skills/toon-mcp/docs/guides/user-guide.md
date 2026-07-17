---
layout: guide
title: TOON Format User Guide - Convert JSON to TOON & Reduce AI Tokens
description: Complete guide to using TOON format for token optimization. Learn JSON to TOON conversion, pattern detection, and advanced techniques to reduce AI token consumption by 60%.
keywords: TOON user guide, JSON to TOON converter, token optimization tutorial, reduce tokens, TOON format examples, AI token savings
prev: /guides/setup
prev_title: Setup Guide
next: /guides/troubleshooting
next_title: Troubleshooting
---

## Introduction

TOON-MCP reduces token consumption in AI-assisted development by converting verbose JSON into compact TOON format. This guide covers all usage patterns, from basic conversion to pattern-aware strategies.

---

## Basic Usage

### Converting JSON to TOON

```python
from src.toon_converter import convert_json_to_toon

data = {
    "id": 12345,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active"
}

toon = convert_json_to_toon(data)
print(toon)
# {"_toon":"1.0","d":{"i":12345,"n":"John Doe","eml":"john@example.com","s":"active"}}
```

### Converting TOON Back to JSON

```python
from src.toon_converter import convert_toon_to_json

toon = '{"_toon":"1.0","d":{"i":12345,"n":"John Doe"}}'
json_str = convert_toon_to_json(toon)
print(json_str)
# {
#   "id": 12345,
#   "name": "John Doe"
# }
```

### Using the TOONConverter Class Directly

```python
from src.toon_converter import TOONConverter
import json

converter = TOONConverter()

toon = converter.json_to_toon(data)
original = converter.toon_to_json(toon)

# Check savings (token estimates at 4 chars/token)
savings = converter.calculate_savings(json.dumps(data), toon)
print(f"Saved {savings['savings_percent']:.1f}% (~{savings['tokens_saved']} tokens)")
print(f"Chars: {savings['original_chars']} → {savings['toon_chars']}")
```

---

## MCP Tools

When TOON-MCP is running as an MCP server, six tools are available in Claude:

### `convert_to_toon`

```
Use the convert_to_toon tool:
- json_data: <your JSON as a string>
- aggressive: false  # optional
```

Returns the TOON string plus savings statistics (chars, estimated tokens, percent saved).

### `convert_to_json`

```
Use the convert_to_json tool:
- toon_data: <TOON string>
```

Returns human-readable indented JSON.

### `analyze_patterns`

```
Use the analyze_patterns tool:
- json_data: <your JSON as a string>
```

Returns detected pattern types, confidence scores, and compression recommendations — useful before deciding whether to compress.

### `get_compression_strategy`

```
Use the get_compression_strategy tool:
- json_data: <your JSON as a string>
```

Returns a strategy recommendation (use schema compression, use references, expected savings %) without performing the conversion.

### `calculate_savings`

```
Use the calculate_savings tool:
- json_data: <your JSON as a string>
```

Estimates token savings without returning the TOON output.

### `batch_convert`

```
Use the batch_convert tool:
- json_array: <JSON array of objects>
- aggressive: false  # optional
```

Converts multiple objects in one call and reports per-item savings.

---

## Standard vs Aggressive Mode

### Standard Mode (default)

Applies key abbreviation from the built-in `KEY_ABBREV` table and schema-based array encoding. Keys not in the table are kept as-is.

```python
converter = TOONConverter()  # aggressive=False
```

Best for: most use cases. Predictable output with no overhead.

### Aggressive Mode

Additionally auto-abbreviates domain-specific keys that appear 2+ times but are not in `KEY_ABBREV`. The custom abbreviations are stored in `_custom_keys` inside the TOON payload so round-trip is always lossless.

```python
converter = TOONConverter(aggressive=True)
toon = converter.json_to_toon(data)
# If domain keys were abbreviated, the TOON payload will contain:
# {"_toon":"1.0","d":{...},"_custom_keys":{"product_name":"prdn",...}}
```

**When aggressive mode helps:** data with many heterogeneous objects that share long domain-specific keys (e.g., `transaction_id`, `customer_first_name`, `product_category`) and cannot all be schema-compressed because their key sets differ slightly.

**When aggressive mode doesn't help:** uniform arrays where schema compression already places each key name only once in `_sch`. Adding `_custom_keys` overhead would offset the abbreviation savings.

---

## Usage Patterns

### Pattern 1: Compressing API Responses

```python
import requests
from src.toon_converter import convert_json_to_toon, convert_toon_to_json
import json

# Fetch large API response
response = requests.get('https://api.example.com/users').json()

# Compress before storing in conversation context
toon = convert_json_to_toon(response)

# Use in Claude prompt
prompt = f"Analyze this user data (TOON format):\n{toon}"

# Restore when you need to process it
original = json.loads(convert_toon_to_json(toon))
```

### Pattern 2: Database Query Results

```python
from src.toon_converter import convert_json_to_toon, TOONConverter
import json

# Large result set — schema compression gives big wins
rows = db.query("SELECT id, name, email, status, created_at FROM users LIMIT 500")

original_json = json.dumps(rows)
converter = TOONConverter()
toon = converter.json_to_toon(rows)

savings = converter.calculate_savings(original_json, toon)
print(f"Database result: {savings['savings_percent']:.1f}% fewer tokens")
```

### Pattern 3: Code Documentation

```python
"""
API Response (TOON — use convert_toon_to_json to restore):
{"_toon":"1.0","d":{"i":123,"n":"John","s":"active"}}
"""

def process_user(user_data):
    from src.toon_converter import convert_toon_to_json
    import json

    if isinstance(user_data, str) and '"_toon"' in user_data:
        user_data = json.loads(convert_toon_to_json(user_data))
    # ... process user_data
```

### Pattern 4: TOON as a Conversation Cache

```python
from src.toon_converter import convert_json_to_toon, convert_toon_to_json
import json

class TOONCache:
    """Store API responses compactly; restore on demand."""

    def __init__(self):
        self._store = {}

    def set(self, key, data):
        self._store[key] = convert_json_to_toon(data)

    def get(self, key):
        toon = self._store.get(key)
        return json.loads(convert_toon_to_json(toon)) if toon else None

cache = TOONCache()
cache.set('users', api_response)
users = cache.get('users')
```

---

## Pattern Detection

`PatternDetector` identifies what kind of data you have so you can choose the right strategy:

### Consistent Schema Array (highest compression)

```python
from src.patterns import PatternDetector

data = [
    {"id": 1, "name": "Item 1", "value": 100},
    {"id": 2, "name": "Item 2", "value": 200},
    # ... 100 more items
]

detector = PatternDetector()
patterns = detector.analyze(data)

# Detected: consistent_schema_array (confidence=1.0)
# TOON will encode this as:
# {"_sch": ["i", "n", "v"], "_dat": [[1, "Item 1", 100], [2, "Item 2", 200], ...]}
```

### API Response Pattern

```python
data = {
    "status": "success",
    "data": [...],
    "message": "OK",
    "meta": {"page": 1, "total": 500}
}
# Detected: api_response — standard abbreviations apply
```

### Getting Recommendations

```python
detector = PatternDetector()
detector.analyze(data)

for rec in detector.get_compression_recommendations():
    print(rec)
# Example: "Array with 100 items has consistent schema — use schema-based compression"
# Example: "Key 'product_name' appears 50 times — ensure it's abbreviated"
```

---

## Token Monitoring

### Basic Monitoring

```python
from context_manager.token_monitor import TokenMonitor

monitor = TokenMonitor(
    warn_threshold=50000,
    critical_threshold=100000
)

# Analyze messages as they flow through a conversation
monitor.analyze_message("User query here", role='user')
monitor.analyze_message(json.dumps(large_api_response), role='tool')

metrics = monitor.get_metrics()
print(f"Estimated tokens so far: {metrics.total_tokens:,}")
print(f"Potential savings if JSON were TOON: {metrics.savings_percent:.1f}%")

# Check if approaching limits
warning = monitor.check_thresholds()
if warning:
    print(warning)
```

### Optimization Recommendations

```python
for rec in monitor.get_optimization_recommendations():
    print(rec)
```

### Export a Report

```python
from pathlib import Path
report = monitor.export_report(Path('token_usage.md'))
```

---

## Tool Output Optimization

### Automatic Optimization

```python
from context_manager.tool_output_optimizer import ToolOutputOptimizer

optimizer = ToolOutputOptimizer(
    auto_optimize=True,
    min_savings=15.0  # only optimize when savings exceed 15%
)

tool_output = {"results": [...]}
optimized, metadata = optimizer.optimize_tool_output("file_search", tool_output)

if metadata['optimized']:
    print(f"Saved {metadata['savings_percent']:.1f}% — {metadata['tokens_saved']} tokens")
    # optimized is a TOON string; use convert_toon_to_json to restore
```

### Batch Optimization

```python
results = optimizer.batch_optimize([
    ("api_call",        api_response),
    ("database_query",  db_results),
    ("file_search",     search_results),
])

for tool_name, optimized, metadata in results:
    print(f"{tool_name}: {metadata['savings_percent']:.1f}% savings")
```

---

## Best Practices

### When to Use TOON

**Use TOON for:**
- Large API responses (> ~100 tokens)
- Arrays of similar objects — schema compression has the biggest impact
- Database query results in AI analysis sessions
- Any data you'll reference repeatedly in a long conversation

**Avoid TOON for:**
- Tiny objects (< 50 tokens) — envelope overhead may negate savings
- Data that must remain human-readable without a conversion step
- Production data storage — TOON is optimized for dev/AI workflows

### Validate Round-Trips on Critical Data

```python
import json
from src.toon_converter import convert_json_to_toon, convert_toon_to_json

original = {"critical": "data", "values": [1, 2, 3]}
toon = convert_json_to_toon(original)
restored = json.loads(convert_toon_to_json(toon))

assert restored == original, "Round-trip mismatch!"
```

### Check Savings Before Committing to TOON

```python
from src.toon_converter import TOONConverter
import json

def should_compress(data, min_savings_percent=15.0):
    original = json.dumps(data)
    converter = TOONConverter()
    toon = converter.json_to_toon(data)
    savings = converter.calculate_savings(original, toon)
    return savings['savings_percent'] >= min_savings_percent, savings
```

---

## Advanced Techniques

### Extending the Abbreviation Table

The built-in `KEY_ABBREV` dictionary lives in `src/config.py`. To add project-specific abbreviations permanently, edit that file:

```python
# src/config.py
KEY_ABBREV = {
    # ... existing entries ...
    'transaction_id':   'txid',
    'account_number':   'acct',
    'customer_email':   'ceml',
}
```

`ABBREV_KEY` (the reverse map) is derived automatically at import time — no other changes needed.

### Getting Pattern-Based Abbreviation Suggestions

```python
from src.patterns import PatternDetector

detector = PatternDetector()
detector.analyze(your_data)

suggestions = detector.suggest_custom_abbreviations()
# {'product_name': 'prdn', 'product_type': 'prdt', ...}
# Use these to decide what to add to KEY_ABBREV permanently.
```

### Compression Strategy Planning

```python
from src.patterns import SmartCompressionStrategy, PatternDetector

detector = PatternDetector()
strategy = SmartCompressionStrategy(detector)

result = strategy.get_strategy(your_data)
print(f"Schema compression:    {result['use_schema_compression']}")
print(f"Reference compression: {result['use_reference_compression']}")
print(f"Expected savings:      {result['expected_savings']*100:.1f}%")
```

### Auto-Converting Files

Scan source files and replace JSON in comments/docstrings/code blocks:

```bash
# Dry run — preview what would change
python claude-code-integration/auto_converter.py ./src --dry-run

# Apply with custom threshold
python claude-code-integration/auto_converter.py ./src --threshold 20
```

---

## Next Steps

- [Troubleshooting Guide]({{ '/guides/troubleshooting' | relative_url }}) — Common issues and fixes
- [API Reference]({{ '/api/reference' | relative_url }}) — Complete API documentation
- [Examples]({{ '/examples' | relative_url }}) — Real-world before/after comparisons
