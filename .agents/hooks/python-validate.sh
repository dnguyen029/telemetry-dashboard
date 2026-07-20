#!/bin/bash
# Refactored Python validator utilizing the project's virtual environment and targeted testing

TARGET_FILE="$AG_TOOL_ARG_FilePath"
PROJECT_ROOT="/home/dnguyen029/telemetry-dashboard"
VENV_BIN="$PROJECT_ROOT/.venv/bin"

if [[ "$TARGET_FILE" == *".py" ]]; then
    echo "🐍 Python file change detected: $TARGET_FILE"

    # 1. Format and check with Ruff inside the virtual environment
    if [ -f "$VENV_BIN/ruff" ]; then
        echo "🧼 Auto-formatting and fixing with Ruff..."
        "$VENV_BIN/ruff" format "$TARGET_FILE"
        "$VENV_BIN/ruff" check --fix "$TARGET_FILE"
    elif command -v uv &> /dev/null; then
        echo "🧼 Auto-formatting and fixing with Ruff via uv..."
        uv run --with ruff ruff format "$TARGET_FILE"
        uv run --with ruff ruff check --fix "$TARGET_FILE"
    else
        echo "⚠️ Ruff not found in virtual environment. Skipping linting."
    fi

    # 2. Run targeted tests if possible, otherwise fall back to full pytest
    if [ -f "$VENV_BIN/pytest" ]; then
        # Check if a corresponding test file exists (e.g., test_*.py or *_test.py)
        BASENAME=$(basename "$TARGET_FILE")
        TEST_TARGET=""
        
        if [[ "$BASENAME" == test_*.py ]]; then
            TEST_TARGET="$TARGET_FILE"
        else
            # Guess test file location based on naming conventions
            DIRNAME=$(dirname "$TARGET_FILE")
            POTENTIAL_TEST="$DIRNAME/test_${BASENAME}"
            if [ -f "$POTENTIAL_TEST" ]; then
                TEST_TARGET="$POTENTIAL_TEST"
            fi
        fi

        if [ -n "$TEST_TARGET" ]; then
            echo "🧪 Running targeted test: $TEST_TARGET"
            "$VENV_BIN/pytest" "$TEST_TARGET"
        else
            echo "🧪 Running full test suite (no specific test file mapped)..."
            "$VENV_BIN/pytest"
        fi

        TEST_STATUS=$?
        if [ $TEST_STATUS -ne 0 ]; then
            echo "❌ Pytest failed with exit code $TEST_STATUS"
            exit 1
        fi
    fi
fi

exit 0
