---
layout: guide
title: TOON-MCP API Reference
description: Complete API documentation for TOON-MCP — TOONConverter, PatternDetector, TokenMonitor, ToolOutputOptimizer, and MCP tools.
keywords: TOON API, toon_converter API, MCP tools reference, token monitor API, TOON Python library
prev: /guides/troubleshooting
prev_title: Troubleshooting
---

## TOON Wire Format

Every TOON payload is a compact JSON object:

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
| `_toon` | Yes | Format version marker (`"1.0"`) |
| `d` | Yes | Compressed data payload |
| `_refs` | No | Shared value references (`@key` expansions) |
| `_custom_keys` | No | Custom key abbreviations — emitted only in aggressive mode |

### Encoding Rules

| Value | TOON Representation |
|-------|---------------------|
| `null` | `"~"` |
| `true` | `"T"` |
| `false` | `"F"` |
| Numbers, strings | Unchanged |
| Object keys | Shortened via `KEY_ABBREV` (plus `_custom_keys` in aggressive mode) |
| Uniform arrays of objects | `{"_sch": [keys], "_dat": [[values], ...]}` |

---

## Core API

### `toon_converter.TOONConverter`

Main converter class for JSON ↔ TOON conversions.

```python
class TOONConverter(aggressive: bool = False)
```

**Parameters:**
- `aggressive` (`bool`, default `False`) — When `True`, auto-abbreviates domain-specific keys that appear 2 or more times in the data and are not already in `KEY_ABBREV`. Custom abbreviations are collected into a `_custom_keys` mapping and written into the TOON payload, enabling lossless round-trip. This mode helps most on heterogeneous objects with long repeated keys; it provides no additional benefit over arrays that are already schema-compressed (`_sch`/`_dat`), where each key appears only once.

**Example:**
```python
from src.toon_converter import TOONConverter

converter = TOONConverter()                  # Standard mode
converter_agg = TOONConverter(aggressive=True)  # Aggressive mode
```

---

#### `json_to_toon`

```python
def json_to_toon(data: Union[Dict, List, str]) -> str
```

Convert JSON to compact TOON format.

**Parameters:**
- `data` — JSON data as a dict, list, or JSON string

**Returns:** Compact TOON string (no whitespace)

**Example:**
```python
converter = TOONConverter()
toon = converter.json_to_toon({"id": 123, "name": "Test", "status": "active"})
# '{"_toon":"1.0","d":{"i":123,"n":"Test","s":"active"}}'
```

---

#### `toon_to_json`

```python
def toon_to_json(toon_str: str) -> str
```

Convert TOON format back to standard indented JSON. Handles `_custom_keys` automatically — no extra steps needed for payloads produced in aggressive mode.

**Parameters:**
- `toon_str` — TOON formatted string

**Returns:** Indented JSON string

---

#### `calculate_savings`

```python
def calculate_savings(original_json: str, toon_str: str) -> Dict[str, Any]
```

Calculate compression statistics. Token counts are **estimated** at `CHARS_PER_TOKEN = 4` characters per token (configurable in `src/config.py`). Both raw character counts and estimated token counts are returned.

**Returns:**
```python
{
    'original_chars':    int,    # Character length of original JSON
    'toon_chars':        int,    # Character length of TOON output
    'original_tokens':   int,    # Estimated: original_chars // 4
    'toon_tokens':       int,    # Estimated: toon_chars // 4
    'tokens_saved':      int,    # original_tokens - toon_tokens
    'savings_percent':   float,  # tokens_saved / original_tokens * 100
    'compression_ratio': float,  # toon_chars / original_chars
}
```

**Example:**
```python
import json
from src.toon_converter import TOONConverter

data = {"id": 1, "name": "Test", "created_at": "2025-01-01T00:00:00Z"}
original = json.dumps(data)
converter = TOONConverter()
toon = converter.json_to_toon(data)

s = converter.calculate_savings(original, toon)
print(f"Saved {s['savings_percent']:.1f}% (~{s['tokens_saved']} tokens)")
print(f"Chars: {s['original_chars']} → {s['toon_chars']}")
```

---

### Convenience Functions

#### `convert_json_to_toon`

```python
def convert_json_to_toon(
    json_data:  Union[Dict, List, str],
    aggressive: bool = False
) -> str
```

One-shot conversion. Creates a `TOONConverter` internally.

#### `convert_toon_to_json`

```python
def convert_toon_to_json(toon_str: str) -> str
```

One-shot restoration. Creates a `TOONConverter` internally.

---

## Pattern Detection API

### `patterns.PatternDetector`

Detects compression opportunities in JSON data.

```python
class PatternDetector()
```

#### `analyze`

```python
def analyze(data: Any) -> List[Pattern]
```

Traverse data and detect patterns. Returns patterns sorted by confidence (highest first).

**Detected pattern types:**

| Pattern type | What it means |
|---|---|
| `api_response` | Keys like status/data/message/meta present |
| `database_record` | Keys like id/created_at/updated_at present |
| `database_records_array` | Array of database-like records |
| `user_data` | Keys like username/email/profile present |
| `nested_address`, `nested_coordinates`, etc. | Known nested object shapes |
| `consistent_schema_array` | All objects share identical keys — prime candidate for `_sch`/`_dat` |
| `repeated_structure` | Same key set appears 3+ times across the tree |
| `homogeneous_array_<type>` | Array of all-same-type primitives |

**Example:**
```python
from src.patterns import PatternDetector

detector = PatternDetector()
patterns = detector.analyze(data)

for p in patterns:
    print(f"{p.pattern_type}: confidence={p.confidence:.2f}, count={p.count}")
```

---

#### `get_compression_recommendations`

```python
def get_compression_recommendations() -> List[str]
```

Human-readable recommendations based on the last `analyze()` call (e.g., "Array with 50 items has consistent schema — use schema-based compression").

---

#### `suggest_custom_abbreviations`

```python
def suggest_custom_abbreviations() -> Dict[str, str]
```

Suggest abbreviations for keys that appear 3+ times and have length > 4. Uses vowel-stripping to generate short forms.

**Returns:** `{"long_key_name": "lkgn", ...}`

> These suggestions are informational. `TOONConverter(aggressive=True)` performs similar auto-abbreviation internally and encodes results in `_custom_keys`.

---

### `patterns.SmartCompressionStrategy`

```python
class SmartCompressionStrategy(detector: PatternDetector)
```

#### `get_strategy`

```python
def get_strategy(data: Any) -> Dict[str, Any]
```

Determine optimal compression strategy without converting.

**Returns:**
```python
{
    'use_schema_compression':    bool,
    'use_reference_compression': bool,
    'custom_abbreviations':      Dict[str, str],
    'expected_savings':          float,   # 0.0–0.60
    'patterns':                  List[Pattern],
}
```

---

## Token Monitoring API

### `token_monitor.TokenMonitor`

Tracks estimated token usage across a conversation and surfaces optimization recommendations.

```python
class TokenMonitor(
    warn_threshold:     int = 50000,
    critical_threshold: int = 100000
)
```

> Token counts are estimated at `CHARS_PER_TOKEN = 4` characters per token, consistent with `TOONConverter.calculate_savings`. For exact counts, install and use `tiktoken`.

---

#### `analyze_message`

```python
def analyze_message(
    content:    str,
    role:       str = 'user',
    message_id: str = None
) -> TokenUsage
```

Analyze a message, auto-detect content type (json/code/text), and estimate optimization potential.

**Parameters:**
- `role` — `'user'`, `'assistant'`, or `'tool'`

---

#### `get_metrics`

```python
def get_metrics() -> ConversationMetrics
```

Aggregate statistics across all analyzed messages.

---

#### `check_thresholds`

```python
def check_thresholds() -> Optional[str]
```

Returns a warning/critical alert string when estimated totals exceed thresholds, or `None`.

---

#### `get_optimization_recommendations`

```python
def get_optimization_recommendations() -> List[str]
```

Actionable recommendations based on current conversation state.

---

#### `export_report`

```python
def export_report(file_path: Optional[Path] = None) -> str
```

Generate a Markdown token-usage report. Optionally writes to `file_path`.

---

## Tool Output Optimization API

### `tool_output_optimizer.ToolOutputOptimizer`

Wraps tool outputs with TOON conversion when savings exceed a threshold.

```python
class ToolOutputOptimizer(
    auto_optimize: bool  = True,
    min_savings:   float = 15.0
)
```

---

#### `optimize_tool_output`

```python
def optimize_tool_output(
    tool_name: str,
    output:    Any
) -> Tuple[Any, Dict[str, Any]]
```

Analyze and optionally convert a tool output. Savings are computed against compact JSON (not indented), so the reported percentages reflect real gains.

**Returns:** `(optimized_output, metadata)` where metadata contains:
```python
{
    'tool_name':         str,
    'original_tokens':   int,
    'toon_tokens':       int,
    'tokens_saved':      int,
    'savings_percent':   float,
    'patterns_detected': List[str],
    'optimized':         bool,
    'optimization_note': str,  # present only when optimized=True
}
```

---

#### `batch_optimize`

```python
def batch_optimize(
    tool_outputs: List[Tuple[str, Any]]
) -> List[Tuple[str, Any, Dict]]
```

Optimize a list of `(tool_name, output)` pairs in one call.

---

#### `get_stats`

```python
def get_stats() -> Dict[str, Any]
```

```python
{
    'total_outputs':      int,
    'optimized_outputs':  int,
    'total_tokens_saved': int,
    'optimization_rate':  float,  # percent
    'avg_tokens_saved':   float,
}
```

---

## MCP Integration API

### `mcp_integration.MCPConfigManager`

Reads and writes the Claude MCP configuration file.

```python
class MCPConfigManager(config_path: Path = None)
```

Default config path: `~/.config/claude/mcp_settings.json`

#### `add_toon_server`

Add the TOON server entry (with correct `cwd`) and save.

#### `enable_toon_for_server`

Set `TOON_OPTIMIZE=true` / `TOON_MIN_SAVINGS=15` on an existing server's env block.

#### `get_server_list`

Returns names of all configured MCP servers.

---

## Auto-Conversion API

### `auto_converter.AutoTOONConverter`

Scans source files and replaces JSON in comments, docstrings, and Markdown code blocks with TOON equivalents. Only converts when `savings_percent >= min_savings_threshold` (default 15%).

```python
class AutoTOONConverter()
```

Supported file types: `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.md`

#### `convert_file`

```python
def convert_file(file_path: Path) -> Tuple[str, int]
```

Returns `(modified_content, conversion_count)`. Does **not** write to disk.

#### `process_directory`

```python
def process_directory(
    directory:  Path,
    extensions: List[str] = None
) -> Dict[str, int]
```

Processes and overwrites files in-place.

**Returns:** `{'files_processed': int, 'files_modified': int, 'total_conversions': int}`

**CLI:**
```bash
# From repo root
python claude-code-integration/auto_converter.py <path> [--dry-run] [--threshold 15]
```

---

### `auto_converter.TOONExampleGenerator`

Generates human-readable JSON vs TOON comparison examples and code snippets.

```python
class TOONExampleGenerator()
```

#### `generate_comparison_example`

```python
def generate_comparison_example(data: Dict) -> str
```

Returns a Markdown block showing original JSON, TOON output, and savings summary.

#### `generate_code_example`

```python
def generate_code_example(language: str, data: Dict) -> str
```

**Parameters:**
- `language` — `'python'`, `'javascript'`, or `'typescript'`

Returns a language-specific snippet that stores the TOON payload and calls the appropriate converter.

---

## MCP Tools

Tools exposed by `src/server.py`. All responses use compact JSON (no indentation) to avoid wasting tokens in the tool output itself.

### `convert_to_toon`

**Input schema:**
```json
{
  "json_data":  "string (required)",
  "aggressive": "boolean (optional, default false)"
}
```

**Response:**
```json
{
  "toon_format": "<toon string>",
  "savings": {
    "original_chars":    142,
    "toon_chars":        68,
    "original_tokens":   35,
    "toon_tokens":       17,
    "tokens_saved":      18,
    "savings_percent":   51.43,
    "compression_ratio": 0.479
  }
}
```

---

### `convert_to_json`

Restore TOON to human-readable JSON.

**Input schema:** `{"toon_data": "string (required)"}`

---

### `analyze_patterns`

Detect compression opportunities.

**Input schema:** `{"json_data": "string (required)"}`

---

### `get_compression_strategy`

Get a compression plan without performing conversion.

**Input schema:** `{"json_data": "string (required)"}`

---

### `calculate_savings`

Estimate token savings without retaining the TOON output.

**Input schema:** `{"json_data": "string (required)"}`

---

### `batch_convert`

Convert an array of JSON objects in one call.

**Input schema:**
```json
{
  "json_array":  "string (required) — JSON array",
  "aggressive":  "boolean (optional, default false)"
}
```

---

## MCP Resources

| URI | MIME type | Description |
|-----|-----------|-------------|
| `toon://stats` | `application/json` | Session conversion count and total tokens saved |
| `toon://guide` | `text/markdown` | Quick-reference TOON format guide |

---

## Data Structures

### `Pattern`

```python
@dataclass
class Pattern:
    pattern_type: str
    confidence:   float                # 0.0–1.0
    keys:         Optional[List[str]]  = None
    sample:       Optional[Any]        = None
    count:        int                  = 0
```

### `TokenUsage`

```python
@dataclass
class TokenUsage:
    timestamp:             float
    message_id:            str
    role:                  str    # 'user' | 'assistant' | 'tool'
    content_type:          str    # 'text' | 'json' | 'code'
    token_count:           int
    optimized_token_count: Optional[int] = None
    savings_potential:     float         = 0.0
    optimization_applied:  bool          = False
```

### `ConversationMetrics`

```python
@dataclass
class ConversationMetrics:
    total_tokens:       int
    user_tokens:        int
    assistant_tokens:   int
    tool_tokens:        int
    optimized_tokens:   int
    total_savings:      int
    savings_percent:    float
    message_count:      int
    optimization_count: int
```

---

## Constants (`src/config.py`)

```python
CHARS_PER_TOKEN    = 4       # Characters per estimated token
WARN_THRESHOLD     = 50000   # Default warn threshold for TokenMonitor
CRITICAL_THRESHOLD = 100000  # Default critical threshold

KEY_ABBREV = {
    'id':            'i',
    'name':          'n',
    'type':          't',
    'value':         'v',
    'data':          'd',
    'message':       'm',
    'status':        's',
    'timestamp':     'ts',
    'created_at':    'ca',
    'updated_at':    'ua',
    'description':   'desc',
    'properties':    'props',
    'attributes':    'attrs',
    'parameters':    'params',
    'configuration': 'cfg',
    'metadata':      'meta',
    'response':      'resp',
    'request':       'req',
    'error':         'err',
    'result':        'res',
    'content':       'cnt',
    'username':      'usr',
    'password':      'pwd',
    'email':         'eml',
    'phone':         'ph',
    'address':       'addr',
    'count':         'ct',
    'total':         'tot',
    'items':         'itms',
    'children':      'ch',
    'parent':        'par',
    'index':         'idx',
    'length':        'len',
    'size':          'sz',
    'width':         'w',
    'height':        'h',
    'position':      'pos',
    'enabled':       'en',
    'disabled':      'dis',
    'visible':       'vis',
    'hidden':        'hid',
}
```

`ABBREV_KEY` (the reverse map used for decompression) is derived automatically from `KEY_ABBREV` at class load time in `toon_converter.py`.

---

For usage patterns and code examples, see the [User Guide]({{ '/guides/user-guide' | relative_url }}). For installation, see the [Setup Guide]({{ '/guides/setup' | relative_url }}).
