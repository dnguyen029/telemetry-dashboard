---
layout: guide
title: TOON-MCP Troubleshooting Guide - Fix Common Issues
description: Troubleshoot TOON format conversion errors, MCP server issues, and token optimization problems. Solutions for common TOON-MCP installation and usage issues.
keywords: TOON troubleshooting, TOON errors, MCP server problems, fix TOON issues, TOON debugging, token optimization errors
prev: /guides/user-guide
prev_title: User Guide
next: /api/reference
next_title: API Reference
---

## Common Issues

### Installation Issues

#### Issue: Module Not Found Error

```
ModuleNotFoundError: No module named 'mcp'
```

**Solution**:

```bash
# Reinstall from the mcp-server-toon directory
cd mcp-server-toon
pip install -e .
```

#### Issue: Python Version Error

```
ERROR: Package 'toon-mcp-server' requires Python >=3.10
```

**Solution**:

```bash
python --version

# If <3.10, upgrade or use pyenv
pyenv install 3.10
pyenv local 3.10
```

#### Issue: Permission Denied on Installation

```
ERROR: Could not install packages due to an EnvironmentError: [Errno 13] Permission denied
```

**Solution**:

```bash
# Use a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .

# Or use the --user flag
pip install --user -e .
```

---

### Configuration Issues

#### Issue: MCP Server Not Found in Claude

**Solution**:

1. Verify config path:

```bash
# macOS/Linux
cat ~/.config/Claude/claude_desktop_config.json

# Windows
type %APPDATA%\Claude\claude_desktop_config.json
```

2. The `cwd` field is required — use absolute paths:

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

3. Find correct Python path:

```bash
which python3  # macOS/Linux
where python   # Windows
```

4. Restart Claude Desktop completely after editing the config.

#### Issue: Server Starts But Tools Not Available

**Diagnostic**:

```bash
# Test server manually
cd mcp-server-toon
python -m src.server
# Expected: INFO:toon-mcp-server:Starting TOON MCP Server...
```

**Solution**:

Check server output for errors. Verify MCP SDK version:

```bash
pip show mcp
# Should be >=0.9.0
```

Update if needed:

```bash
pip install --upgrade mcp
```

---

### Docker Issues

#### Issue: Docker Image Build Fails

```
ERROR: failed to solve: process "/bin/sh -c pip install..." did not complete successfully
```

**Solution**:

```bash
# Clean Docker cache and rebuild
docker system prune -a
docker build --no-cache -t toon-mcp-server:latest .

# Check Docker disk space
docker system df
```

#### Issue: Container Exits Immediately

```bash
docker ps -a
# Shows: Exited (1) 2 seconds ago
```

**Diagnosis**:

```bash
# Check container logs
docker logs toon-mcp-server

# Run interactively to debug
docker run -it toon-mcp-server:latest /bin/bash
```

**Common Causes**:

1. **Missing dependencies**: Check Dockerfile COPY commands
2. **Permission issues**: Ensure non-root user has access to `/app`

**Solution**:

```dockerfile
# Ensure proper ownership in Dockerfile
RUN chown -R toon:toon /app

# Verify Python can import modules
RUN python -c "from src.server import main; print('OK')"
```

#### Issue: Docker MCP Integration Not Working

Config:

```json
{
  "mcpServers": {
    "toon": {
      "command": "docker",
      "args": ["run", "-i", "toon-mcp-server:latest"]
    }
  }
}
```

**Diagnostic Steps**:

```bash
# Check if image exists
docker images | grep toon-mcp-server

# Test container can start
docker run --rm -i toon-mcp-server:latest

# Verify Docker daemon is running
docker info
```

Restart Claude Desktop after configuration changes.

#### Issue: Permission Denied (Docker)

```
Got permission denied while trying to connect to the Docker daemon socket
```

**Solution**:

```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in

# macOS: Ensure Docker Desktop is running
open -a Docker
```

#### Issue: Container Resource Limits

**Diagnosis**:

```bash
docker stats toon-mcp-server
```

**Solution**: Edit `docker-compose.yml`:

```yaml
services:
  toon-mcp-server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1024M
```

Then: `docker-compose down && docker-compose up -d`

---

### Conversion Issues

#### Issue: Round-Trip Conversion Fails

```python
original != restored  # AssertionError
```

**Diagnosis**:

```python
from src.toon_converter import convert_json_to_toon, convert_toon_to_json
import json

original = {"test": "data"}
toon = convert_json_to_toon(original)
restored = json.loads(convert_toon_to_json(toon))

print(f"Match: {original == restored}")
print(f"Original: {original}")
print(f"Restored: {restored}")
```

**Common Causes**:

1. **Float precision**: Python floats may lose precision through JSON serialization. Use `parse_float` if needed:

```python
restored = json.loads(
    convert_toon_to_json(toon),
    parse_float=lambda x: round(float(x), 6)
)
```

2. **Special characters**: Ensure proper UTF-8 encoding throughout.

#### Issue: Low Savings Percentage

**Diagnosis**:

```python
from src.patterns import PatternDetector

detector = PatternDetector()
patterns = detector.analyze(your_data)

for pattern in patterns:
    print(f"{pattern.pattern_type}: confidence={pattern.confidence:.2f}")

for rec in detector.get_compression_recommendations():
    print(rec)
```

**Solutions**:

1. **Small objects**: Objects under ~50 estimated tokens see minimal benefit — the `{"_toon":"1.0","d":...}` envelope has fixed overhead.

2. **Heterogeneous arrays**: Arrays where objects have varying keys can't use schema compression. Try aggressive mode:

```python
from src.toon_converter import TOONConverter
converter = TOONConverter(aggressive=True)
```

3. **Short or unique keys**: If keys are already short, abbreviation gains are small. TOON works best with long, repeated key names.

---

### Token Count Questions

#### Why don't the estimated token counts match tiktoken?

TOON uses character-based estimation (`CHARS_PER_TOKEN = 4` in `src/config.py`) — `estimated_tokens = chars // 4`. This is a rough approximation. `calculate_savings` returns both `original_chars`/`toon_chars` (exact character counts) and `original_tokens`/`toon_tokens` (estimates).

For exact token counts, use `tiktoken`:

```bash
pip install tiktoken
```

```python
import tiktoken

encoding = tiktoken.get_encoding("cl100k_base")
exact_count = len(encoding.encode(text))

print(f"Estimated (chars/4): {len(text) // 4}")
print(f"Exact (tiktoken):    {exact_count}")
```

---

### Tool Output Optimization Issues

#### Issue: Auto-Optimization Not Working

**Diagnosis**:

```python
from context_manager.tool_output_optimizer import ToolOutputOptimizer

optimizer = ToolOutputOptimizer(auto_optimize=True, min_savings=15.0)
output, metadata = optimizer.optimize_tool_output("test", sample_data)
print(f"Optimized: {metadata['optimized']}")
```

**Solutions**:

1. **Lower savings threshold**:

```python
optimizer = ToolOutputOptimizer(min_savings=10.0)
```

2. **Check output format** — input must be JSON-serializable (dict or list), not a plain string.

3. **Check output size** — outputs smaller than ~100 characters may not meet the threshold.

---

### Token Monitor Issues

#### Issue: Threshold Warnings Not Showing

**Diagnosis**:

```python
from context_manager.token_monitor import TokenMonitor

monitor = TokenMonitor(warn_threshold=50000, critical_threshold=100000)
metrics = monitor.get_metrics()
print(f"Current tokens: {metrics.total_tokens}")

warning = monitor.check_thresholds()
print(f"Warning: {warning}")
```

**Solution**: Lower thresholds for testing:

```python
monitor = TokenMonitor(warn_threshold=100, critical_threshold=500)
```

---

### MCP Integration Issues

#### Issue: Multiple Servers Conflict

Each MCP server runs in its own process via stdio — no port conflicts. If one server fails, check its log independently. Each can have its own `env`:

```json
{
  "mcpServers": {
    "toon": {
      "command": "python",
      "args": ["-m", "src.server"],
      "cwd": "/absolute/path/to/toon-context-mcp/mcp-server-toon"
    },
    "other-server": {
      "command": "node",
      "args": ["server.js"]
    }
  }
}
```

#### Issue: Environment Variables Not Set

Add to MCP config:

```json
{
  "mcpServers": {
    "toon": {
      "command": "python",
      "args": ["-m", "src.server"],
      "cwd": "/absolute/path/to/toon-context-mcp/mcp-server-toon",
      "env": {
        "TOON_OPTIMIZE": "true",
        "TOON_MIN_SAVINGS": "15"
      }
    }
  }
}
```

---

## Debugging Tips

### Enable Debug Logging

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Test Individual Components

```python
from src.toon_converter import TOONConverter
converter = TOONConverter()
print("Converter initialized")

from src.patterns import PatternDetector
detector = PatternDetector()
print("Detector initialized")

from context_manager.token_monitor import TokenMonitor
monitor = TokenMonitor()
print("Monitor initialized")
```

### Verify Data Integrity

```python
def verify_toon_conversion(data):
    import json
    from src.toon_converter import convert_json_to_toon, convert_toon_to_json

    toon = convert_json_to_toon(data)
    restored = json.loads(convert_toon_to_json(toon))

    if restored == data:
        print("Conversion preserves data")
        return True
    else:
        print("Data mismatch!")
        print(f"Original: {data}")
        print(f"Restored: {restored}")
        return False
```

### Run the Test Suite

```bash
cd mcp-server-toon
pytest tests/ -v
```

All 20 tests should pass.

---

## Getting Help

### Collect Diagnostic Info

```bash
python --version
pip show mcp
pip show toon-mcp-server

# Test basic functionality (from mcp-server-toon/)
python -c "from src.toon_converter import convert_json_to_toon; print('OK')"

# Run tests
pytest tests/ -v
```

### Opening an Issue

Include:

1. **Python version**: `python --version`
2. **MCP version**: `pip show mcp`
3. **OS**: macOS / Windows / Linux
4. **Full error traceback**
5. **Minimal reproduction**:

```python
from src.toon_converter import convert_json_to_toon

data = {"your": "data"}
result = convert_json_to_toon(data)  # Error occurs here
```

- **[GitHub Issues](https://github.com/aj-geddes/toon-context-mcp/issues)** — Bug reports
- **[GitHub Discussions](https://github.com/aj-geddes/toon-context-mcp/discussions)** — Questions
- **[API Reference]({{ '/api/reference' | relative_url }})** — Complete documentation
