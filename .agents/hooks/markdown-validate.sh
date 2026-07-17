#!/bin/bash
# Hook to validate and auto-format markdown files using markdownlint-cli2
TARGET_FILE=""
if [ -n "$AG_TOOL_ARG_TargetFile" ]; then
    TARGET_FILE="$AG_TOOL_ARG_TargetFile"
elif [ -n "$AG_TOOL_ARG_FilePath" ]; then
    TARGET_FILE="$AG_TOOL_ARG_FilePath"
fi

if [[ "$TARGET_FILE" == *".md" ]]; then
    if [[ "$TARGET_FILE" == *".gemini"* || "$TARGET_FILE" == *"/brain/"* || "$TARGET_FILE" == *".agents/"* ]]; then
        exit 0
    fi
    if [ -f "$TARGET_FILE" ]; then
        echo "📝 Markdown file change detected: $TARGET_FILE"
        npx markdownlint-cli2 --fix "$TARGET_FILE"
    fi
fi
exit 0
