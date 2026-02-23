# Cloudflare MCP Integration Design

## TL;DR

Integrate the official `@cloudflare/mcp-server-cloudflare` MCP server with OpenCode to manage Cloudflare resources (KV, D1, Workers, R2, Queues, Analytics) through natural language. Simple setup: add config entry + wrangler login.

## Context

### Original Request

User wanted to install and configure "Cloudflare Code Mode" MCP server locally with a custom folder structure including `ai/`, `mcp/code-mode/`, custom `server.ts`, build scripts, etc.

### Design Clarification

After research and clarification, the official Cloudflare MCP server:
- Runs via `npx @cloudflare/mcp-server-cloudflare`
- Does NOT require custom TypeScript code or build steps
- Provides 50+ production tools for Cloudflare resources
- Uses stdio transport (compatible with OpenCode)

### Decision

Use the official Cloudflare MCP server with minimal configuration changes.

## Work Objectives

### Core Objective

Enable OpenCode to manage Cloudflare resources through natural language using the official MCP server.

### Concrete Deliverables

1. Add Cloudflare MCP server entry to `opencode.json`
2. Install and configure Wrangler CLI
3. Authenticate with Cloudflare account
4. Verify MCP server connectivity

### Must Have

- Working MCP connection to Cloudflare
- Ability to list/query Cloudflare resources
- stdio transport (no HTTP server needed)

### Must NOT Have

- Custom TypeScript server code (not needed)
- Complex folder structure (not needed)
- Build scripts (not needed)

## Architecture

### Component Overview

```
OpenCode
    │
    ├── opencode.json
    │   └── mcp.cloudflare entry
    │
    └── MCP Server (spawned via npx)
            │
            └── @cloudflare/mcp-server-cloudflare
                    │
                    └── Cloudflare API (via Wrangler auth)
```

### Transport

- **Type**: stdio (local process)
- **Command**: `npx -y @cloudflare/mcp-server-cloudflare`
- **No HTTP/SSE needed** - runs as local subprocess

### Authentication

- Wrangler CLI stores credentials in `~/.wrangler/`
- OAuth flow via `npx wrangler login`
- MCP server inherits Wrangler authentication

## Available Tools

### Workers (8 tools)
- `worker_list`, `worker_get`, `worker_deploy`, `worker_delete`
- `versions_list`, `versions_get`, `versions_upload`
- `tail_start`, `tail_stop`

### KV (6 tools)
- `get_kvs`, `kv_get`, `kv_put`, `kv_delete`, `kv_list`, `kv_count`

### D1 (5 tools)
- `d1_list`, `d1_query`, `d1_execute`, `d1_create`, `d1_delete`

### R2 (6 tools)
- `r2_list_buckets`, `r2_create_bucket`, `r2_delete_bucket`
- `r2_list_objects`, `r2_get_object`, `r2_put_object`

### Queues (4 tools)
- `queue_list`, `queue_send_message`, `queue_create`, `queue_delete`

### Analytics
- `analytics_get` - domain analytics with date filtering

### Wrangler Config
- `wrangler_get_config`, `wrangler_update_config`

## Implementation Steps

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
# or use npx without install
```

### Step 2: Authenticate with Cloudflare
```bash
npx wrangler login
```
This opens browser for OAuth flow.

### Step 3: Add MCP Configuration
Add to `opencode.json` under `mcp`:
```json
"cloudflare": {
  "type": "local",
  "command": ["npx", "-y", "@cloudflare/mcp-server-cloudflare"]
}
```

### Step 4: Restart OpenCode
Restart to pick up new MCP server.

### Step 5: Verify
Test by asking OpenCode to list Cloudflare resources.

## Alternative: Remote MCP Servers

Cloudflare also provides remote MCP servers that don't require Wrangler:

| Server | URL |
|--------|-----|
| Documentation | `https://docs.mcp.cloudflare.com/mcp` |
| Bindings | `https://bindings.mcp.cloudflare.com/mcp` |
| Observability | `https://observability.mcp.cloudflare.com/mcp` |
| Browser Rendering | `https://browser.mcp.cloudflare.com/mcp` |
| Containers | `https://containers.mcp.cloudflare.com/mcp` |

To use remote servers:
```json
"cloudflare-docs": {
  "type": "local",
  "command": ["npx", "-y", "mcp-remote", "https://docs.mcp.cloudflare.com/mcp"]
}
```

## Future Extensions

### Adding Custom MCP Servers

If custom tools are needed later (e.g., sandboxed execution):
1. Create `ai/mcp/custom-server/` folder
2. Build TypeScript MCP server with `@modelcontextprotocol/sdk`
3. Add to `opencode.json` as separate MCP entry

### Multiple MCP Servers

OpenCode supports multiple MCP servers simultaneously:
```json
"mcp": {
  "cloudflare": { ... },
  "filesystem": { ... },
  "custom-server": { ... }
}
```

## Troubleshooting

### Common Issues

1. **"Not authenticated"** - Run `npx wrangler login`
2. **"Account not found"** - Verify Cloudflare account exists
3. **"Permission denied"** - Check API token scopes

### Debug Mode

Test MCP server directly:
```bash
npx @cloudflare/mcp-server-cloudflare
# Then send JSON-RPC messages via stdin
```

## Verification Criteria

- [ ] Wrangler authenticated successfully
- [ ] MCP server entry added to opencode.json
- [ ] OpenCode can call Cloudflare tools
- [ ] At least one resource query succeeds (e.g., `worker_list`)

## Estimated Effort

**15-30 minutes** - mostly waiting for OAuth flow and restart.
