# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands below are run from `mcp-server-toon/` unless otherwise noted.

**Install (editable mode):**
```bash
cd mcp-server-toon && pip install -e .
# For dev tools (black, ruff, mypy):
pip install -e ".[dev]"
```

**Run tests:**
```bash
# Unit tests only (Docker-safe, no subprocess stdio):
cd mcp-server-toon && pytest tests/test_conversions.py -v
# Wire-protocol integration tests (run locally, not in Docker):
cd mcp-server-toon && pytest -m integration -v
# All tests locally:
cd mcp-server-toon && pytest tests/ -v
# Single test:
pytest tests/test_conversions.py::TestTOONConverter::test_round_trip_conversion -v
```

**Run the MCP server:**
```bash
cd mcp-server-toon && python -m src.server
```

**Lint / format:**
```bash
cd mcp-server-toon
ruff check src/ tests/
black src/ tests/
mypy src/
```

**Auto-converter CLI** (from repo root):
```bash
python claude-code-integration/auto_converter.py <path> [--dry-run] [--threshold 15]
```

**Token monitor demo** (from repo root):
```bash
python context-manager/token_monitor.py
```

**Docs (Jekyll):**
```bash
cd docs && bundle install && bundle exec jekyll serve
```

## Format Compliance Note

"TOON" is a **naming collision** with an established community format released ~Nov 2025 called **Token-Oriented Object Notation** (toon-format/spec on GitHub, provisional IANA type `text/toon`). Key distinctions:

- This project expands to **Token-Optimized** Object Notation; the established one is **Token-Oriented**.
- The wire formats are architecturally incompatible: the established TOON is text/indentation-based (like YAML-meets-CSV); this project's TOON is JSON-in-JSON with a `{"_toon":"1.0","d":...}` envelope.
- This project's specific field names (`_toon`, `_refs`, `_sch`, `_dat`, `_custom_keys`) do not conflict with any existing published standard.
- No parser would confuse the two formats syntactically, but users searching for "TOON" will find the text-based spec. Consider clarifying this distinction in user-facing docs.

## Architecture

The project has three loosely coupled phases, all sharing the same core converter:

```
toon-context-mcp/
├── mcp-server-toon/      # Phase 1 – installable MCP server (the canonical package)
│   └── src/
│       ├── config.py         # KEY_ABBREV dict + threshold constants
│       ├── toon_converter.py # TOONConverter class + convenience functions
│       ├── patterns.py       # PatternDetector + SmartCompressionStrategy
│       └── server.py         # TOONMCPServer (MCP protocol, 6 tools, 2 resources)
├── context-manager/      # Phase 3 – standalone scripts, import from mcp-server-toon via sys.path
│   ├── token_monitor.py       # TokenMonitor, ProactiveOptimizer
│   ├── tool_output_optimizer.py
│   └── mcp_integration.py
└── claude-code-integration/  # Phase 2 – standalone scripts
    ├── auto_converter.py      # AutoTOONConverter, TOONExampleGenerator
    └── example_generator.py
```

### TOON wire format

Every TOON string is a compact JSON object with:
- `_toon`: version marker (`"1.0"`)
- `d`: the compressed data payload
- `_refs` *(optional)*: shared reference definitions

Key compression strategies applied by `TOONConverter`:
1. **Key abbreviation** — driven by `KEY_ABBREV` in `config.py` (e.g. `"metadata"→"meta"`, `"created_at"→"ca"`). Extend this dict to add new abbreviations.
2. **Schema-based array compression** — arrays of objects with identical keys are encoded as `{"_sch":[...keys...],"_dat":[[...values...],...]}`.
3. **Null/bool compaction** — `null → "~"`, `true → "T"`, `false → "F"`.

Round-trip integrity relies on `ABBREV_KEY` (auto-derived as the inverse of `KEY_ABBREV`). If you add a key to `KEY_ABBREV`, the inverse is rebuilt automatically at class load time.

### Import resolution for context-manager and claude-code-integration

`token_monitor.py` and `auto_converter.py` are not part of the installed package. They resolve `src.*` imports by inserting `mcp-server-toon/` into `sys.path` at runtime. Run them from the repo root or ensure `mcp-server-toon` is installed.

### Token savings metric

`calculate_savings()` uses **character count / 4** as a token approximation, not a real tokenizer. Reported percentages are estimates.

### MCP wire protocol

mcp>=1.0 uses **NDJSON** (newline-delimited JSON) for stdio transport — one JSON object per line, no `Content-Length` headers. Older tutorials and SDK examples that use `Content-Length: N\r\n\r\n<body>` framing are out of date.

The integration tests in `tests/test_mcp_integration.py` communicate over this NDJSON stream directly using `select.select` + `proc.stdout.read1()` — marked `@pytest.mark.integration` and excluded from the Docker run because `pytest-asyncio`'s event loop interferes with blocking subprocess I/O.

### MCP Claude Desktop config

```json
{
  "mcpServers": {
    "toon": {
      "command": "python",
      "args": ["-m", "src.server"],
      "cwd": "/path/to/toon-context-mcp/mcp-server-toon"
    }
  }
}
```
