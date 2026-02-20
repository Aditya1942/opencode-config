#!/bin/bash
# Launch OpenCode with local API key from opencode-local.json
# The local config merges with opencode.json but is never committed to git

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN_CONFIG="$SCRIPT_DIR/opencode.json"
LOCAL_CONFIG="$SCRIPT_DIR/opencode-local.json"
TEMP_CONFIG="$SCRIPT_DIR/opencode-merged.json"

# Check if local config exists
if [ ! -f "$LOCAL_CONFIG" ]; then
    echo "❌ Error: $LOCAL_CONFIG not found"
    exit 1
fi

# Merge configs: opencode-local.json overrides values in opencode.json
# We use jq to do a deep merge where local config takes precedence
echo "🔧 Merging configs..."
jq -s '.[0] * .[1]' "$MAIN_CONFIG" "$LOCAL_CONFIG" > "$TEMP_CONFIG"

# Verify the merge worked
if [ ! -f "$TEMP_CONFIG" ] || [ ! -s "$TEMP_CONFIG" ]; then
    echo "❌ Error: Config merge failed"
    exit 1
fi

echo "✅ Config merged successfully"

# Close any existing OpenCode instances
pkill -f "OpenCode.app" 2>/dev/null || true
sleep 2

# Launch OpenCode with merged config using OPENCODE_CONFIG env var
echo "🚀 Launching OpenCode with local API key..."
export OPENCODE_CONFIG="$TEMP_CONFIG"
open -a /Applications/OpenCode.app

# Cleanup temp config after OpenCode loads (10 second delay)
sleep 10
rm -f "$TEMP_CONFIG"
echo "✅ Temp config cleaned up"
