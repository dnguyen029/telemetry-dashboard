---
layout: default
title: TOON Format - Token-Optimized Object Notation for AI | Reduce JSON Tokens by 60%
description: TOON (Token-Optimized Object Notation) is a JSON compression format that reduces AI token usage by up to 60%. Free MCP server for Claude and LLMs.
keywords: TOON format, token optimization, JSON compression, reduce AI tokens, MCP server, Claude optimization, token saver, AI development tools, JSON to TOON converter
---

<div class="hero">
    <h1>TOON-MCP</h1>
    <p>Token-Optimized Object Notation for Efficient AI Context Management</p>
    <div>
        <a href="{{ '/guides/setup' | relative_url }}" class="btn">Get Started</a>
        <a href="https://github.com/aj-geddes/toon-context-mcp" class="btn btn-secondary">View on GitHub</a>
    </div>
</div>

## What is TOON-MCP?

TOON-MCP is a **Model Context Protocol (MCP) server** that converts verbose JSON into **Token-Optimized Object Notation (TOON)**, reducing token consumption in AI-assisted development workflows by up to **60%**.

[Learn more about TOON format →]({{ '/what-is-toon' | relative_url }})

### Useful When Working With:
- **Large API responses** that consume significant context tokens
- **Complex JSON data** in Claude and LLM conversations
- **Token-limited workflows** where every token counts
- **Data-heavy MCP integrations** and tool outputs

**New to TOON?** See [real-world examples]({{ '/examples' | relative_url }}) with before/after comparisons.

## Key Features

<div class="features-grid">
    <div class="feature-card">
        <div class="feature-icon">🚀</div>
        <h3>Schema Compression</h3>
        <p>Arrays of objects with identical keys are encoded once as a schema — keys appear once instead of once per item</p>
    </div>

    <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Token Monitoring</h3>
        <p>Tracks estimated conversation token usage with optimization recommendations</p>
    </div>

    <div class="feature-card">
        <div class="feature-icon">🔌</div>
        <h3>MCP Integration</h3>
        <p>Six tools and two resources, available directly in Claude Desktop and Claude Code</p>
    </div>

    <div class="feature-card">
        <div class="feature-icon">🔄</div>
        <h3>Lossless Conversion</h3>
        <p>100% lossless round-trip between JSON and TOON, including aggressive mode</p>
    </div>

    <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Auto-Optimization</h3>
        <p>Wraps tool outputs with TOON conversion when savings exceed a configurable threshold</p>
    </div>

    <div class="feature-card">
        <div class="feature-icon">📝</div>
        <h3>File Scanner</h3>
        <p>CLI tool to scan source files and convert JSON in comments and code blocks</p>
    </div>
</div>

## Quick Example

**Original JSON** (~35 estimated tokens):
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

**TOON Format** (~17 estimated tokens, ~52% reduction):
```json
{"_toon":"1.0","d":{"i":12345,"n":"John Doe","eml":"john@example.com","t":"user","s":"active","meta":{"ca":"2025-01-01T00:00:00Z","ua":"2025-01-15T10:30:00Z"}}}
```

Token counts are estimated at 4 characters per token (`CHARS_PER_TOKEN = 4` in `src/config.py`).

## Getting Started

<div class="card">
    <h3>Installation</h3>
    <pre><code>git clone https://github.com/aj-geddes/toon-context-mcp.git
cd toon-context-mcp/mcp-server-toon
pip install -e .</code></pre>
</div>

<div class="card">
    <h3>MCP Configuration</h3>
    <p>Add to your Claude config. The <code>cwd</code> field is required:</p>
    <pre><code>{
  "mcpServers": {
    "toon": {
      "command": "python",
      "args": ["-m", "src.server"],
      "cwd": "/absolute/path/to/toon-context-mcp/mcp-server-toon"
    }
  }
}</code></pre>
</div>

<div class="card">
    <h3>Python Usage</h3>
    <pre><code>from src.toon_converter import convert_json_to_toon

toon = convert_json_to_toon(your_json_data)</code></pre>
</div>

## Typical Token Savings

| Data type | Typical reduction |
|---|---|
| API responses (arrays) | 40–60% |
| Database record arrays | 50–65% |
| Configuration objects | 35–50% |
| Log/event arrays | 30–45% |

Savings scale with array length and key verbosity. A single small object may save 10–15%; a 100-row result set with long keys can exceed 60%.

[See detailed examples →]({{ '/examples' | relative_url }})

## Next Steps

- [Setup Guide]({{ '/guides/setup' | relative_url }}) — Install and configure TOON-MCP
- [User Guide]({{ '/guides/user-guide' | relative_url }}) — Usage patterns and best practices
- [Troubleshooting]({{ '/guides/troubleshooting' | relative_url }}) — Common issues and solutions
- [API Reference]({{ '/api/reference' | relative_url }}) — Complete API documentation

## Community & Support

- GitHub: [aj-geddes/toon-context-mcp](https://github.com/aj-geddes/toon-context-mcp)
- Issues: [Report a bug](https://github.com/aj-geddes/toon-context-mcp/issues)
- Discussions: [Ask questions](https://github.com/aj-geddes/toon-context-mcp/discussions)

---

<p style="text-align: center; color: #6b7280;">MIT licensed — free for commercial use.</p>
