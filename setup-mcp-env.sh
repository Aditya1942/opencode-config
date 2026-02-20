#!/bin/bash
# Setup environment for OpenCode MCP servers
# Source this file before starting OpenCode: source setup-mcp-env.sh

# Check if .env.local exists
if [ -f "$(dirname "$0")/.env.local" ]; then
    # Load environment variables from .env.local
    export $(grep -v '^#' "$(dirname "$0")/.env.local" | xargs)
    echo "✅ Loaded Z_AI_API_KEY from .env.local"
else
    echo "❌ .env.local not found in $(dirname "$0")"
    exit 1
fi
