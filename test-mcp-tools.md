# MCP & Tools Integration Test Prompt

> **Copy-paste this entire prompt into a new OpenCode session to test all MCP servers and built-in tools.**
> Last verified: 2026-02-21

---

## Instructions

Run every test below **in order**. For each test, call the specified tool, then record the result as PASS / FAIL / SKIP in the final report table at the end. After all tests complete, print the full report.

---

## SECTION A: Built-in OpenCode Tools (7 tests)

### A1. Bash Tool
Run a bash command:
```
Bash: echo "TOOL_TEST: Bash works at $(date)" && uname -s
```
**Expected**: Output shows date and OS name (Darwin for macOS).

### A2. Read Tool
Read a known file:
```
Read: /Users/aditya/.config/opencode/opencode.json (first 20 lines)
```
**Expected**: JSON content starting with `{` and `"$schema"`.

### A3. Write Tool
Create a temporary test file:
```
Write: /tmp/opencode-mcp-test.txt
Content: "MCP Integration Test - Tool Verification\nTimestamp: <current time>\nStatus: CREATED"
```
**Expected**: File written successfully.

### A4. Edit Tool
Edit the file created in A3:
```
Edit: /tmp/opencode-mcp-test.txt
Replace "Status: CREATED" with "Status: EDITED"
```
**Expected**: Edit applied successfully. Then Read the file to confirm.

### A5. Glob Tool
Search for JSON files:
```
Glob: pattern="*.json" path="/Users/aditya/.config/opencode"
```
**Expected**: Returns list including `opencode.json`, `mcp-servers.json`, `package.json`.

### A6. Grep Tool
Search for a pattern in config files:
```
Grep: pattern="server-everything" include="*.json" path="/Users/aditya/.config/opencode"
```
**Expected**: Finds matches in `opencode.json` and/or `mcp-servers.json`.

### A7. Cleanup
Remove the temp file:
```
Bash: rm /tmp/opencode-mcp-test.txt && echo "Cleanup OK"
```
**Expected**: Cleanup OK.

---

## SECTION B: Z.AI MCP Servers (4 tests)

### B1. zai-vision (Image Analysis)
Analyze a public test image:
```
zai-vision analyze_image:
  image_source: "https://httpbin.org/image/png"
  prompt: "Describe what you see in this image in one sentence"
```
**Expected**: Returns a description of the image content.

### B2. zai-web-search (Web Search)
Search the web:
```
zai-web-search webSearchPrime:
  search_query: "Model Context Protocol MCP latest news"
```
**Expected**: Returns search results with titles, links, and content summaries.

### B3. zai-web-reader (Web Reader)
Fetch and read a URL:
```
zai-web-reader webReader:
  url: "https://httpbin.org/get"
  return_format: "text"
```
**Expected**: Returns JSON response showing request headers and origin IP.

### B4. zai-zread (GitHub Repo Reader)
Read a GitHub repo structure:
```
zai-zread get_repo_structure:
  repo_name: "modelcontextprotocol/servers"
```
**Expected**: Returns directory tree showing `src/everything/`, `src/filesystem/`, etc.

---

## SECTION C: Official MCP Servers (7 tests)

### C1. Everything Server - Echo Tool
```
everything echo:
  message: "Hello from MCP integration test!"
```
**Expected**: Returns "Echo: Hello from MCP integration test!"

### C2. Everything Server - Add Tool
```
everything add:
  a: 42
  b: 58
```
**Expected**: Returns "The sum of 42 and 58 is 100."

### C3. Everything Server - printEnv Tool
```
everything printEnv: {}
```
**Expected**: Returns a JSON object with environment variables.

### C4. Everything Server - getTinyImage Tool
```
everything getTinyImage: {}
```
**Expected**: Returns content containing a base64 image and text description.

### C5. Everything Server - annotatedMessage Tool
```
everything annotatedMessage:
  messageType: "success"
  includeImage: false
```
**Expected**: Returns "Operation completed successfully" with annotation metadata.

### C6. Everything Server - structuredContent Tool
```
everything structuredContent:
  location: "Mumbai"
```
**Expected**: Returns structured weather-like data with temperature, conditions, humidity.

### C7. Everything Server - getResourceReference Tool
```
everything getResourceReference:
  resourceId: 1
```
**Expected**: Returns resource reference for Resource 1 with URI `test://static/resource/1`.

---

## SECTION D: Filesystem MCP Server (3 tests)

### D1. List Directory
```
filesystem list_directory:
  path: "/Users/aditya/.config/opencode"
```
**Expected**: Returns listing of files including `opencode.json`.

### D2. Read File
```
filesystem read_file:
  path: "/Users/aditya/.config/opencode/package.json"
```
**Expected**: Returns content of `package.json` with `@opencode-ai/plugin` dependency.

### D3. Search Files
```
filesystem search_files:
  path: "/Users/aditya/.config/opencode"
  pattern: "mcp"
```
**Expected**: Returns files matching the pattern.

---

## SECTION E: Memory MCP Server (3 tests)

### E1. Create Entity
```
memory create_entities:
  entities: [{"name": "MCP_Test_Entity", "entityType": "test", "observations": ["Created during integration test", "Should be found by search"]}]
```
**Expected**: Entity created successfully.

### E2. Search Memory
```
memory search_nodes:
  query: "MCP_Test_Entity"
```
**Expected**: Returns the entity created in E1 with its observations.

### E3. Cleanup - Delete Entity
```
memory delete_entities:
  entityNames: ["MCP_Test_Entity"]
```
**Expected**: Entity deleted successfully.

---

## SECTION F: Sequential Thinking MCP Server (1 test)

### F1. Sequential Thinking Step
```
sequential-thinking sequentialthinking:
  thought: "Testing if the sequential thinking MCP server is connected and responding correctly."
  nextThoughtNeeded: false
  thoughtNumber: 1
  totalThoughts: 1
```
**Expected**: Returns acknowledgment of the thinking step with thought metadata.

---

## SECTION G: Fetch MCP Server (1 test)

### G1. Fetch URL
```
fetch fetch:
  url: "https://httpbin.org/html"
  max_length: 500
```
**Expected**: Returns HTML content from httpbin converted to markdown.

---

## SECTION H: Git MCP Server (1 test)

### H1. Git Status
```
git git_status:
  repo_path: "/Users/aditya/.config/opencode"
```
**Expected**: Returns git status output showing branch info and file states.

---

## SECTION I: Time MCP Server (1 test)

### I1. Get Current Time
```
time get_current_time:
  timezone: "Asia/Kolkata"
```
**Expected**: Returns current date/time in IST timezone.

---

## SECTION J: Plugin Tools (1 test)

### J1. Antigravity Quota
```
antigravity_quota: {}
```
**Expected**: Returns quota status for configured accounts (may show errors if accounts are expired).

---

## FINAL REPORT

After running all tests, fill in this table and present it to the user:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    MCP & TOOLS INTEGRATION TEST REPORT                      ║
╠═══════╦══════════════════════════════════╦══════════╦════════════════════════╣
║ Test  ║ Description                      ║ Status   ║ Notes                  ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION A: Built-in Tools       ║          ║                        ║
║ A1    ║ Bash tool                        ║ ___      ║                        ║
║ A2    ║ Read tool                        ║ ___      ║                        ║
║ A3    ║ Write tool                       ║ ___      ║                        ║
║ A4    ║ Edit tool                        ║ ___      ║                        ║
║ A5    ║ Glob tool                        ║ ___      ║                        ║
║ A6    ║ Grep tool                        ║ ___      ║                        ║
║ A7    ║ Cleanup                          ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION B: Z.AI MCP Servers     ║          ║                        ║
║ B1    ║ zai-vision (image analysis)      ║ ___      ║                        ║
║ B2    ║ zai-web-search                   ║ ___      ║                        ║
║ B3    ║ zai-web-reader                   ║ ___      ║                        ║
║ B4    ║ zai-zread (GitHub reader)        ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION C: Everything Server    ║          ║                        ║
║ C1    ║ echo tool                        ║ ___      ║                        ║
║ C2    ║ add tool                         ║ ___      ║                        ║
║ C3    ║ printEnv tool                    ║ ___      ║                        ║
║ C4    ║ getTinyImage tool                ║ ___      ║                        ║
║ C5    ║ annotatedMessage tool            ║ ___      ║                        ║
║ C6    ║ structuredContent tool           ║ ___      ║                        ║
║ C7    ║ getResourceReference tool        ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION D: Filesystem Server    ║          ║                        ║
║ D1    ║ list_directory                   ║ ___      ║                        ║
║ D2    ║ read_file                        ║ ___      ║                        ║
║ D3    ║ search_files                     ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION E: Memory Server        ║          ║                        ║
║ E1    ║ create_entities                  ║ ___      ║                        ║
║ E2    ║ search_nodes                     ║ ___      ║                        ║
║ E3    ║ delete_entities (cleanup)        ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION F: Sequential Thinking  ║          ║                        ║
║ F1    ║ sequential thinking step         ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION G: Fetch Server         ║          ║                        ║
║ G1    ║ fetch URL                        ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION H: Git Server           ║          ║                        ║
║ H1    ║ git_status                       ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION I: Time Server          ║          ║                        ║
║ I1    ║ get_current_time                 ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SECTION J: Plugin Tools         ║          ║                        ║
║ J1    ║ antigravity_quota                ║ ___      ║                        ║
╠═══════╬══════════════════════════════════╬══════════╬════════════════════════╣
║       ║  SUMMARY                         ║          ║                        ║
║ TOTAL ║ ___ / 28 tests                   ║          ║                        ║
║ PASS  ║ ___                              ║          ║                        ║
║ FAIL  ║ ___                              ║          ║                        ║
║ SKIP  ║ ___                              ║          ║                        ║
╚═══════╩══════════════════════════════════╩══════════╩════════════════════════╝
```

### Status Definitions
- **PASS**: Tool responded with expected output
- **FAIL**: Tool returned error or unexpected output
- **SKIP**: Tool not available / server not connected / dependency missing

### Troubleshooting Failed Tests

If a test FAILS, check:
1. **Server not connected**: Restart OpenCode to reload MCP config
2. **Package not installed**: Run the install command from `mcp-servers.json`
3. **Python servers (fetch/git/time)**: Ensure `uv` is installed: `pip install uv`
4. **TypeScript servers**: Ensure `npx` works: `npm --version`
5. **Remote servers (Z.AI)**: Check API key validity in `opencode.json`
6. **Filesystem server**: Check `--allowed-directories` path is correct
7. **Timeout errors**: Retry — first-time npx downloads can be slow
