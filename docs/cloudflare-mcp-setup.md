# Cloudflare MCP Server — Setup & Reference

## Overview

The official `@cloudflare/mcp-server-cloudflare` MCP server is integrated with OpenCode,
giving you natural-language access to your entire Cloudflare account: Workers, KV, D1, R2,
Queues, Durable Objects, AI, Workflows, Zones, Secrets, and more (~70+ tools).

## Configuration

Entry in `opencode.json` under `mcp`:

```json
"cloudflare": {
  "type": "local",
  "command": [
    "npx",
    "-y",
    "@cloudflare/mcp-server-cloudflare",
    "run",
    "<your-account-id>"
  ]
}
```

**Transport**: stdio (local subprocess, no HTTP server needed)

## Authentication

The MCP server uses Wrangler CLI credentials.

```bash
# Login (one-time, opens browser)
npx wrangler login

# Verify
npx wrangler whoami

# Re-authenticate if needed
npx wrangler login --force
```

Credentials stored in `~/.wrangler/config/default.toml`.

## Available Tool Categories

| Category | Key Tools | Count |
|----------|-----------|-------|
| Workers | `worker_list`, `worker_get`, `worker_put`, `worker_deploy`, `worker_delete` | 5 |
| KV | `get_kvs`, `kv_get`, `kv_put`, `kv_delete`, `kv_list` | 5 |
| R2 | `r2_list_buckets`, `r2_create_bucket`, `r2_get_object`, `r2_put_object` | 7 |
| D1 | `d1_list_databases`, `d1_create_database`, `d1_query` | 4 |
| Durable Objects | `do_list_namespaces`, `do_create_namespace`, `do_get_object`, alarms | 10 |
| Queues | `queue_list`, `queue_create`, `queue_send_message`, `queue_send_batch` | 8 |
| AI | `ai_inference`, `ai_list_models`, `ai_text_generation`, `ai_image_generation` | 6 |
| Workflows | `workflow_list`, `workflow_create`, `workflow_execute` | 5 |
| Templates | `template_list`, `template_get`, `template_create_worker` | 3 |
| Zones/Domains | `zones_list`, `zones_get`, `domain_list` | 3 |
| Routes/CRON | `route_create`, `route_list`, `cron_create`, `cron_list` | 8 |
| Secrets/Env | `secret_put`, `secret_list`, `env_var_set`, `env_var_list` | 7 |
| Versions | `version_list`, `version_get`, `version_rollback` | 3 |
| Analytics | `analytics_get`, `workers_analytics_search` | 2 |
| Wrangler Config | `wrangler_config_get`, `wrangler_config_update` | 2 |
| Service Bindings | `service_binding_create`, `service_binding_list` | 4 |
| Dispatch (WfP) | `wfp_create_dispatch_namespace`, `wfp_add_custom_domain` | 6 |

## Example Prompts

```
"List all my Cloudflare Workers"
"Create a new KV namespace called 'user-sessions'"
"Query my D1 database: SELECT * FROM users LIMIT 10"
"Deploy a Worker named 'hello-world' with this script: ..."
"List all R2 buckets"
"Send a message to my queue 'notifications'"
"Show me Workers analytics for the last 24 hours"
"List available AI models on Cloudflare"
"Generate text with @cf/meta/llama-3-8b-instruct: explain MCP"
```

## Troubleshooting

### "Not authenticated"
```bash
npx wrangler login
```

### Server won't start
```bash
# Test directly
npx -y @cloudflare/mcp-server-cloudflare run <account-id>
```

### Inspect available tools
```bash
npx @modelcontextprotocol/inspector npx -y @cloudflare/mcp-server-cloudflare run <account-id>
```

### Check account ID
```bash
npx wrangler whoami
```

### Reset credentials
```bash
rm -rf ~/.wrangler/config
npx wrangler login
```

## Adding More MCP Servers

OpenCode supports multiple MCP servers simultaneously. Add entries to `opencode.json`:

```json
"mcp": {
  "cloudflare": { ... },
  "cloudflare-docs": {
    "type": "local",
    "command": ["npx", "-y", "mcp-remote", "https://docs.mcp.cloudflare.com/mcp"]
  },
  "cloudflare-browser": {
    "type": "local",
    "command": ["npx", "-y", "mcp-remote", "https://browser.mcp.cloudflare.com/mcp"]
  }
}
```

### Cloudflare Remote MCP Servers

These don't require Wrangler auth — they use OAuth via browser:

| Server | URL | Purpose |
|--------|-----|---------|
| Documentation | `https://docs.mcp.cloudflare.com/mcp` | Cloudflare docs lookup |
| Bindings | `https://bindings.mcp.cloudflare.com/mcp` | Build Workers with storage/AI |
| Builds | `https://builds.mcp.cloudflare.com/mcp` | Workers Builds management |
| Observability | `https://observability.mcp.cloudflare.com/mcp` | Logs and analytics |
| Radar | `https://radar.mcp.cloudflare.com/mcp` | Internet traffic insights |
| Containers | `https://containers.mcp.cloudflare.com/mcp` | Sandbox environments |
| Browser | `https://browser.mcp.cloudflare.com/mcp` | Web page rendering |
| Logpush | `https://logs.mcp.cloudflare.com/mcp` | Log job health |
| AI Gateway | `https://ai-gateway.mcp.cloudflare.com/mcp` | AI prompt logs |

## Debugging Connection Issues

1. **JSON validation**: `python3 -m json.tool opencode.json`
2. **Direct server test**: Send JSON-RPC via stdin:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | npx -y @cloudflare/mcp-server-cloudflare run <account-id>
   ```
3. **MCP Inspector**: `npx @modelcontextprotocol/inspector npx -y @cloudflare/mcp-server-cloudflare run <account-id>`
4. **Wrangler auth check**: `npx wrangler whoami`
5. **Check OpenCode logs**: Look for MCP connection errors after restart

## Building Custom MCP Servers

If you need custom tools beyond Cloudflare's:

```bash
mkdir -p ~/.config/opencode/ai/mcp/custom-server
cd ~/.config/opencode/ai/mcp/custom-server
npm init -y
npm install @modelcontextprotocol/sdk zod typescript
```

Create `server.ts`:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "custom-server", version: "1.0.0" });

server.tool("hello_world", "Says hello", { name: z.string() }, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}!` }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

Add to `opencode.json`:
```json
"custom-server": {
  "type": "local",
  "command": ["npx", "tsx", "/path/to/server.ts"]
}
```
