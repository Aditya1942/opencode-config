# Cloudflare MCP Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the official Cloudflare MCP server with OpenCode to manage Cloudflare resources through natural language.

**Architecture:** Add Cloudflare MCP server entry to existing `opencode.json`, authenticate via Wrangler CLI, verify connectivity by listing Cloudflare resources.

**Tech Stack:** OpenCode, @cloudflare/mcp-server-cloudflare (npm), Wrangler CLI, stdio transport

---

## Prerequisites Check

Before starting, verify:
- [ ] Node.js installed (check: `node --version`)
- [ ] npm available (check: `npm --version`)
- [ ] OpenCode installed and working
- [ ] Cloudflare account exists

---

### Task 1: Verify Prerequisites

**Files:**
- None (verification only)

**Step 1: Check Node.js version**

Run: `node --version`
Expected: v18.x or higher (LTS)

**Step 2: Check npm version**

Run: `npm --version`
Expected: 9.x or higher

**Step 3: Verify OpenCode config exists**

Run: `ls -la ~/.config/opencode/opencode.json`
Expected: File exists

---

### Task 2: Install and Configure Wrangler CLI

**Files:**
- None (CLI installation)

**Step 1: Verify Wrangler is available via npx**

Run: `npx wrangler --version`
Expected: Version number displayed (e.g., 4.x.x)

Note: We use npx to avoid global install. Wrangler will be cached locally.

**Step 2: Authenticate with Cloudflare**

Run: `npx wrangler login`
Expected: Browser opens for OAuth flow, success message after authorization

**Step 3: Verify authentication**

Run: `npx wrangler whoami`
Expected: Displays your Cloudflare account email and account ID

---

### Task 3: Add Cloudflare MCP to OpenCode Configuration

**Files:**
- Modify: `/Users/aditya/.config/opencode/opencode.json`

**Step 1: Read current opencode.json**

Run: Read the file to see current structure
Note the existing `mcp` object structure.

**Step 2: Add Cloudflare MCP entry**

Add this entry to the `mcp` object in `opencode.json`:

```json
    "cloudflare": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@cloudflare/mcp-server-cloudflare"
      ]
    }
```

Placement: Add after the existing MCP servers (after `"web-search"` entry).

**Step 3: Verify JSON is valid**

Run: `cat ~/.config/opencode/opencode.json | python3 -m json.tool > /dev/null && echo "Valid JSON"`
Expected: "Valid JSON"

---

### Task 4: Test MCP Server Directly

**Files:**
- None (testing only)

**Step 1: Test Cloudflare MCP server spawns correctly**

Run: `timeout 5 npx -y @cloudflare/mcp-server-cloudflare 2>&1 || true`
Expected: Server starts without errors, may output initialization message

**Step 2: Test with MCP Inspector (optional)**

Run: `npx @modelcontextprotocol/inspector npx -y @cloudflare/mcp-server-cloudflare`
Expected: Inspector UI opens, shows available Cloudflare tools

Note: This is optional but useful for debugging. Press Ctrl+C to exit.

---

### Task 5: Verify OpenCode Integration

**Files:**
- None (verification only)

**Step 1: Restart OpenCode**

Action: Quit and restart OpenCode to load new MCP configuration

**Step 2: Verify Cloudflare MCP is loaded**

In OpenCode, run a test query:
```
List all my Cloudflare Workers using the MCP tools
```

Expected: OpenCode uses the cloudflare MCP server and lists Workers (or reports empty list if none exist)

**Step 3: Test another Cloudflare resource**

In OpenCode:
```
List all my KV namespaces
```

Expected: Lists KV namespaces or reports empty list

---

### Task 6: Document Setup

**Files:**
- Create: `/Users/aditya/.config/opencode/docs/cloudflare-mcp-setup.md`

**Step 1: Create documentation file**

Create the file with:

```markdown
# Cloudflare MCP Setup

## Installation

Cloudflare MCP server is configured in `opencode.json` and runs via npx.

## Authentication

Run once to authenticate:
```bash
npx wrangler login
```

## Available Tools

- Workers: worker_list, worker_get, worker_deploy, worker_delete
- KV: get_kvs, kv_get, kv_put, kv_delete
- D1: d1_list, d1_query, d1_execute
- R2: r2_list_buckets, r2_get_object, r2_put_object
- Queues: queue_list, queue_send_message
- Analytics: analytics_get

## Troubleshooting

### Not authenticated
```bash
npx wrangler login
```

### Check authentication
```bash
npx wrangler whoami
```

### Test MCP server directly
```bash
npx @modelcontextprotocol/inspector npx -y @cloudflare/mcp-server-cloudflare
```

## Remote MCP Servers

Alternative remote servers (no wrangler needed):
- Docs: https://docs.mcp.cloudflare.com/mcp
- Bindings: https://bindings.mcp.cloudflare.com/mcp
- Observability: https://observability.mcp.cloudflare.com/mcp
```

**Step 2: Commit documentation**

Run:
```bash
git add docs/cloudflare-mcp-setup.md docs/plans/
git commit -m "docs: add Cloudflare MCP integration documentation"
```

---

## Verification Checklist

After all tasks complete:

- [ ] Wrangler authenticated (`npx wrangler whoami` shows account)
- [ ] Cloudflare MCP entry in opencode.json
- [ ] Valid JSON in opencode.json
- [ ] OpenCode restarted
- [ ] Can list Cloudflare resources via OpenCode
- [ ] Documentation created and committed

---

## Troubleshooting Guide

### MCP Server Not Loading

1. Check JSON is valid: `python3 -m json.tool opencode.json`
2. Check npx can run: `npx -y @cloudflare/mcp-server-cloudflare`
3. Restart OpenCode completely

### Authentication Errors

1. Run `npx wrangler login`
2. Check browser completed OAuth
3. Run `npx wrangler whoami` to verify

### Empty Results

1. Verify Cloudflare account has resources
2. Check API token permissions
3. Try in Cloudflare dashboard to confirm resources exist

---

## Future: Adding Custom MCP Servers

If you need custom tools (e.g., sandboxed execution):

1. Create folder: `~/.config/opencode/ai/mcp/custom-server/`
2. Initialize: `npm init -y && npm install @modelcontextprotocol/sdk`
3. Create `server.ts` with custom tools
4. Add to opencode.json:
```json
"custom-server": {
  "type": "local",
  "command": ["node", "/Users/aditya/.config/opencode/ai/mcp/custom-server/dist/index.js"]
}
```

---

## Estimated Time

- Task 1-2: 5-10 minutes (verification + auth)
- Task 3: 2 minutes (config edit)
- Task 4: 2-5 minutes (testing)
- Task 5: 5 minutes (verification)
- Task 6: 3 minutes (docs)

**Total: 15-25 minutes**
