# MCP Servers Configuration

This directory contains the Model Context Protocol (MCP) servers configuration for OpenCode AI assistant.

## 📁 Files

| File | Purpose |
|------|---------|
| `mcp-servers.json` | Detailed catalog of all MCP servers with full metadata |
| `opencode.json` | Main OpenCode config with MCP server connections |

## 🚀 Available MCP Servers

### Official MCP Servers

| Server | Category | Description | Install |
|--------|----------|-------------|----------|
| **everything** | Reference / Testing | Comprehensive demo of all MCP capabilities | `npm install -g @modelcontextprotocol/server-everything` |
| **filesystem** | File System | Secure file operations with access control | `npm install -g @modelcontextprotocol/server-filesystem` |
| **memory** | Memory / Context | Knowledge graph-based persistent memory | `npm install -g @modelcontextprotocol/server-memory` |
| **sequential-thinking** | Reasoning | Step-by-step reflective problem solving | `npm install -g @modelcontextprotocol/server-sequential-thinking` |
| **fetch** | Web / Search | Web content retrieval (HTML→markdown) | `pip install mcp-server-fetch` |
| **git** | DevOps / Version Control | Git repository operations | `pip install mcp-server-git` |
| **time** | Utilities | Time data & timezone management | `pip install mcp-server-time` |

### Agent prompt tools (Explore & Librarian)

| Server | Category | Description | Install |
|--------|----------|-------------|----------|
| **ast-grep** | Code Search | Structural pattern matching (AST). Explore: `ast_grep`. | `brew install ast-grep` then `uvx --from git+https://github.com/ast-grep/ast-grep-mcp ast-grep-server` |
| **context7** | Web / Search | Official docs lookup. Librarian: `context7`. Optional: `CONTEXT7_API_KEY`. | `npx -y @upstash/context7-mcp@latest` |
| **grep-app** | Web / Search | GitHub code search. Librarian: `grep_app`. | `uvx grep-mcp` or `pip install grep-mcp` |
| **web-search** | Web / Search | Free web search. Librarian: `websearch`. Multi-provider (DuckDuckGo, Bing, SearXNG), no API key. | `npx -y @zhafron/mcp-web-search` |

### Z.AI Servers (Pre-configured)

| Server | Type | Description |
|--------|------|-------------|
| **zai-vision** | Local | Image analysis and OCR capabilities |
| **zai-web-search** | Remote | Web search functionality |
| **zai-web-reader** | Remote | Web page reading and extraction |
| **zai-zread** | Remote | GitHub repository code analysis |

## 🔧 Configuration Details

### Filesystem Server
Configured to access your home directory (`/Users/aditya`) for safe file operations.

### Memory Server
Stores entities and observations across sessions for persistent context.

### Sequential Thinking Server
Configured to log thought processes (can be disabled by setting `DISABLE_THOUGHT_LOGGING: true`).

### Similar tools (keep one)

| Prompt tool | Provided by | Note |
|-------------|-------------|------|
| **ripgrep / grep** | **filesystem** (search files) | No separate grep MCP added; filesystem covers in-repo text search. In Cursor, the built-in Grep tool is also available. |
| **lsp_symbols / lsp_find_references** | **Cursor:** user-jetbrains `get_symbol_info`. **OpenCode:** optional lsp-mcp (per-workspace, cargo). | Not added here; use IDE LSP in Cursor or add lsp-mcp if needed. |

### API keys (optional but recommended)

- **context7:** Get key at [context7.com/dashboard](https://context7.com/dashboard). Set `CONTEXT7_API_KEY` in the environment for higher rate limits.

## 📊 Discovery Platforms

Find more MCP servers at:

| Platform | Servers | URL |
|----------|---------|-----|
| **mcp.so** | 10,000+ | https://mcp.so/ |
| **MCPmarket.cn** | 30,000+ | https://mcpmarket.cn/ |
| **Smithery.ai** | 1,700+ | https://smithery.ai |
| **Cursor Directory** | 500+ | https://cursor.directory |
| **Awesome MCP** | 200+ | https://github.com/punkpeye/awesome-mcp-servers |

## 🛠️ Usage

All MCP servers are automatically available to your OpenCode AI assistant. The assistant can:

- **Read/write files** via the filesystem server
- **Remember context** across sessions via the memory server
- **Think step-by-step** via the sequential thinking server
- **Fetch web content** via the fetch server
- **Manage Git repositories** via the git server
- **Query time data** via the time server
- **Test MCP capabilities** via the everything server
- **Explore agent:** structural search (ast-grep), text search (filesystem), symbol/references (IDE or lsp-mcp)
- **Librarian agent:** docs (context7), GitHub search (grep-app), web search (web-search); fetch for URL content

## 🔒 Security Notes

- **Filesystem server**: Restricted to `/Users/aditya` directory
- **Fetch server**: Respects robots.txt by default
- All servers use `npx` or `uvx` for isolated execution

## 📚 Additional Resources

- [Official MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [OpenCode Documentation](https://opencode.ai/docs)

## 🔄 Adding New Servers

To add a new MCP server:

1. Edit `mcp-servers.json` with the server details
2. Add the server configuration to `opencode.json` under the `mcp` section
3. Install the server package (npm/pip/uvx)
4. Restart OpenCode to pick up the changes

Example configuration format:

```json
"my-server": {
  "type": "local",
  "command": ["npx", "-y", "@example/mcp-server"],
  "description": "My custom MCP server"
}
```

For remote servers:

```json
"my-remote-server": {
  "type": "remote",
  "url": "https://api.example.com/mcp",
  "headers": {
    "Authorization": "Bearer your-token"
  }
}
```

---

Generated by OpenCode MCP Integration
