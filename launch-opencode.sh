#!/bin/bash
# Launch OpenCode with MCP environment variables properly set

# Load environment variables
export $(grep -v '^#' "$HOME/.config/opencode/.env.local" | xargs)

# Check if API key is loaded
if [ -z "$Z_AI_API_KEY" ]; then
    echo "❌ Error: Z_AI_API_KEY not found in .env.local"
    exit 1
fi

echo "✅ Z_AI_API_KEY loaded: ${Z_AI_API_KEY:0:10}..."
echo "🚀 Launching OpenCode..."

# Close any existing OpenCode instances
pkill -f "OpenCode.app" 2>/dev/null
sleep 2

# Launch OpenCode with environment
open -a /Applications/OpenCode.app
