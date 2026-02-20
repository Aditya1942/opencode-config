#!/bin/bash

# Oh My OpenCode Uninstall Script
# This script safely removes Oh My OpenCode and restores your original config

set -e

BACKUP_DATE="${1:-$(ls -t opencode.json.backup-* 2>/dev/null | head -1 | grep -o '[0-9]\{8\}-[0-9]\{6\}')}"

if [ -z "$BACKUP_DATE" ]; then
    echo "❌ No backup found! Cannot safely uninstall."
    exit 1
fi

echo "🔄 Restoring configuration from: $BACKUP_DATE"

# Restore opencode.json
if [ -f "opencode.json.backup-$BACKUP_DATE" ]; then
    cp "opencode.json.backup-$BACKUP_DATE" opencode.json
    echo "✅ Restored opencode.json"
else
    echo "❌ Backup file not found: opencode.json.backup-$BACKUP_DATE"
    exit 1
fi

# Restore AGENTS.md if it exists
if [ -f "AGENTS.md.backup-$BACKUP_DATE" ]; then
    cp "AGENTS.md.backup-$BACKUP_DATE" AGENTS.md
    echo "✅ Restored AGENTS.md"
fi

# Uninstall the plugin via npm
echo "📦 Uninstalling oh-my-opencode package..."
npm uninstall -g oh-my-opencode || echo "⚠️  npm uninstall failed (may have been installed locally)"

echo "✅ Uninstall complete! Your configuration is restored."
echo ""
echo "To verify, run: opencode --version"
