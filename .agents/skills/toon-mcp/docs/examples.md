---
layout: default
title: TOON Format Examples - Real-World Token Optimization Use Cases
description: Explore real-world TOON format examples showing 40-60% token reduction. See before/after comparisons for APIs, databases, configs, and more.
keywords: TOON examples, TOON format samples, JSON to TOON conversion examples, token optimization examples, TOON use cases
---

# TOON Format Examples

Real-world examples showing how TOON reduces token consumption across different use cases.

Token counts below are estimated at **4 characters per token** (`CHARS_PER_TOKEN = 4`). Actual tokenization depends on the model. Examples use aggressive mode (`TOONConverter(aggressive=True)`) to show maximum compression — standard mode keeps keys not in `KEY_ABBREV` verbatim.

---

## API Response Optimization

### Example 1: REST API User Data

**Original JSON** (~141 estimated tokens):
```json
{
  "users": [
    {
      "id": 1001,
      "username": "alice_dev",
      "email": "alice@example.com",
      "status": "active",
      "role": "developer",
      "created_at": "2024-01-15T10:30:00Z",
      "last_login": "2025-01-17T08:22:00Z",
      "preferences": {
        "theme": "dark",
        "notifications": true,
        "language": "en"
      }
    },
    {
      "id": 1002,
      "username": "bob_designer",
      "email": "bob@example.com",
      "status": "active",
      "role": "designer",
      "created_at": "2024-02-20T14:15:00Z",
      "last_login": "2025-01-17T09:45:00Z",
      "preferences": {
        "theme": "light",
        "notifications": false,
        "language": "en"
      }
    }
  ]
}
```

**TOON Format (aggressive mode)** (~71 estimated tokens, ~50% reduction):
```json
{"_toon":"1.0","d":{"users":[{"i":1001,"usr":"alice_dev","eml":"alice@example.com","s":"active","role":"developer","ca":"2024-01-15T10:30:00Z","ll":"2025-01-17T08:22:00Z","prf":{"thm":"dark","ntf":"T","lng":"en"}},{"i":1002,"usr":"bob_designer","eml":"bob@example.com","s":"active","role":"designer","ca":"2024-02-20T14:15:00Z","ll":"2025-01-17T09:45:00Z","prf":{"thm":"light","ntf":"F","lng":"en"}}]},"_custom_keys":{"last_login":"ll","preferences":"prf","theme":"thm","notifications":"ntf","language":"lng"}}
```

**Impact**: Fit ~2× more user records in the same context window.

---

## Database Query Results

### Example 2: E-commerce Orders

**Original JSON** (~105 estimated tokens):
```json
{
  "orders": [
    {
      "order_id": "ORD-2025-001",
      "customer_id": 5501,
      "order_date": "2025-01-15",
      "total_amount": 149.99,
      "currency": "USD",
      "status": "shipped",
      "items": [
        {"product_id": "PROD-123", "quantity": 2, "unit_price": 49.99},
        {"product_id": "PROD-456", "quantity": 1, "unit_price": 49.99}
      ]
    }
  ]
}
```

**TOON Format** (~55 estimated tokens, ~48% reduction):
```json
{"_toon":"1.0","d":{"orders":[{"oid":"ORD-2025-001","cid":5501,"od":"2025-01-15","ta":149.99,"cur":"USD","s":"shipped","itms":[{"pid":"PROD-123","qty":2,"up":49.99},{"pid":"PROD-456","qty":1,"up":49.99}]}]},"_custom_keys":{"order_id":"oid","customer_id":"cid","order_date":"od","total_amount":"ta","currency":"cur","items":"itms","product_id":"pid","quantity":"qty","unit_price":"up"}}
```

Note: the `itms` array uses schema compression — `_sch`/`_dat` is applied automatically for uniform arrays.

---

## Configuration Files

### Example 3: Application Config

**Original JSON** (~108 estimated tokens):
```json
{
  "application": {
    "name": "MyApp",
    "version": "2.1.0",
    "environment": "production",
    "database": {
      "host": "db.example.com",
      "port": 5432,
      "database_name": "myapp_prod",
      "connection_pool": {
        "min_connections": 5,
        "max_connections": 20,
        "timeout": 30000
      }
    },
    "cache": {
      "enabled": true,
      "redis_host": "cache.example.com",
      "redis_port": 6379,
      "ttl": 3600
    },
    "features": {
      "authentication": true,
      "rate_limiting": true,
      "analytics": false
    }
  }
}
```

**TOON Format (standard mode)** (~57 estimated tokens, ~47% reduction):
```json
{"_toon":"1.0","d":{"application":{"n":"MyApp","v":"2.1.0","environment":"production","database":{"h":"db.example.com","p":5432,"database_name":"myapp_prod","connection_pool":{"min_connections":5,"max_connections":20,"timeout":30000}},"cache":{"en":"T","redis_host":"cache.example.com","redis_port":6379,"ttl":3600},"features":{"authentication":"T","rate_limiting":"T","analytics":"F"}}}}
```

Standard mode: only keys in `KEY_ABBREV` are abbreviated (`name→n`, `version→v`, `host→h`, `port→p`, `enabled→en`, `true→T`, `false→F`). Domain-specific keys like `database_name` stay verbatim.

---

## Log Data & Monitoring

### Example 4: Application Logs — Schema Compression

This example shows the biggest win: a uniform array where all objects share the same keys.

**Original JSON** (~78 estimated tokens):
```json
[
  {
    "timestamp": "2025-01-17T10:30:45Z",
    "level": "error",
    "message": "Database connection failed",
    "service": "api-gateway",
    "user_id": 7890
  },
  {
    "timestamp": "2025-01-17T10:31:02Z",
    "level": "info",
    "message": "Request processed",
    "service": "api-gateway",
    "user_id": 7891
  }
]
```

**TOON Format (standard mode, schema compression)** (~38 estimated tokens, ~51% reduction):
```json
{"_toon":"1.0","d":{"_sch":["ts","lvl","m","svc","uid"],"_dat":[["2025-01-17T10:30:45Z","error","Database connection failed","api-gateway",7890],["2025-01-17T10:31:02Z","info","Request processed","api-gateway",7891]]}}
```

Schema compression eliminates all repeated key strings. For 100-item arrays this typically accounts for 40–55% of total savings.

---

## Savings by Data Type

| Data type | Typical estimated reduction |
|---|---|
| API response arrays | 40–60% |
| Database record arrays | 50–65% |
| Configuration objects | 35–50% |
| Log/event arrays | 30–45% |

Savings scale with array length and key verbosity. A single 3-field object may save only 10–15%; a 100-row result set with long keys can exceed 60%.

---

## Integration Examples

### Python: Compress Before Passing to Claude

```python
import requests
from src.toon_converter import convert_json_to_toon, convert_toon_to_json
import json

response = requests.get('https://api.example.com/users').json()

toon = convert_json_to_toon(response)
prompt = f"Analyze this user data (TOON format, use convert_toon_to_json to restore):\n{toon}"

# Restore when processing
original = json.loads(convert_toon_to_json(toon))
```

### Check Savings Before Compressing

```python
from src.toon_converter import TOONConverter
import json

def should_compress(data, min_savings_percent=15.0):
    original = json.dumps(data)
    converter = TOONConverter()
    toon = converter.json_to_toon(data)
    savings = converter.calculate_savings(original, toon)
    return savings['savings_percent'] >= min_savings_percent, savings

compress, stats = should_compress(api_response)
if compress:
    print(f"Saving {stats['savings_percent']:.1f}% — {stats['tokens_saved']} estimated tokens")
```

### MCP Tool Usage in Claude

```
Use the convert_to_toon tool with:
- json_data: { "your": "json" }
- aggressive: false

Response includes toon_format plus savings statistics.
```

```
Use the analyze_patterns tool with:
- json_data: { "your": "json" }

Response shows detected patterns and compression recommendations
before you commit to converting.
```

---

- [Setup Guide]({{ '/guides/setup' | relative_url }}) — Install TOON-MCP
- [User Guide]({{ '/guides/user-guide' | relative_url }}) — All usage patterns
- [API Reference]({{ '/api/reference' | relative_url }}) — Full documentation

---

<div class="alert alert-info">
<strong>Pro Tip</strong><br>
TOON's biggest gains come from arrays of objects with identical key sets — schema compression eliminates repeated key strings entirely. The more items in your array and the longer your key names, the better the compression ratio.
</div>
