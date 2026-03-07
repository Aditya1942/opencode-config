#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PORT="${CLAUDE_CODE_MCP_PORT:-4318}"

export PATH="${CLAUDE_CODE_MCP_PATH:-/Users/aditya/.local/bin:/Users/aditya/.nvm/versions/node/v25.8.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin}"

cd "${REPO_DIR}"

exec mcp-proxy \
  --host 127.0.0.1 \
  --port "${PORT}" \
  --server stream \
  --streamEndpoint /mcp \
  --stateless \
  -- \
  node "${SCRIPT_DIR}/claude-code-server.mjs"
