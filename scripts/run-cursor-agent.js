#!/usr/bin/env node
/**
 * Run Cursor CLI agent with a single prompt.
 * Default: print-mode JSON; returns only success result.
 * With --thinking: ACP mode; returns result + optional thinking.
 *
 * Usage:
 *   node scripts/run-cursor-agent.js -- "your prompt"
 *   node scripts/run-cursor-agent.js --cwd /path --mode ask -- "prompt"
 *   node scripts/run-cursor-agent.js --model composer-1.5 -- "prompt"
 *   node scripts/run-cursor-agent.js --workspace /path/to/project -- "prompt"
 *   node scripts/run-cursor-agent.js --thinking -- "prompt"
 *
 * Output (stdout): JSON envelope
 *   Success: { "success": true,  "result": "...", "thinking"?: ["..."] }
 *   Failure: { "success": false, "error": "..." }
 *   Exit code is 1 on failure.
 *
 * ACP session/update event shapes (verified against Cursor CLI 2026.03.11):
 *   { method: "session/update", params: { update: { sessionUpdate: "agent_message_chunk", content: { text: "..." } } } }
 *   { method: "session/update", params: { update: { sessionUpdate: "agent_thinking",      content: { text: "..." } } } }
 *
 * ACP mode does NOT support --model or --workspace (silently uses account default).
 * Pass those flags only in print mode (without --thinking).
 *
 * Cursor CLI --mode flag: only accepts 'plan' and 'ask'. Default (no flag) = agent mode.
 * Never pass '--mode agent' — the CLI rejects it with exit code 1.
 */

import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

const MODES = ['agent', 'plan', 'ask']

// Strip all ANSI/VT100 escape sequences from a string — not just SGR (color/bold),
// but also cursor movement (CSI), erase, mode-set, OSC sequences, etc.
// This ensures error messages returned inside JSON are clean text.
const ANSI_RE = /\x1b(\[[0-9;?]*[A-Za-z]|\][^\x07\x1b]*(\x07|\x1b\\)|[()][0-9A-Za-z])/g
function stripAnsi(str) {
  return str.replace(ANSI_RE, '')
}

// Classify a cursor stderr line: return null if benign/debug noise,
// or { message } if it is a real error worth surfacing.
// Mirrors t3code's classifyCodexStderrLine approach.
const STDERR_LOG_RE = /^\d{4}-\d{2}-\d{2}T\S+\s+(TRACE|DEBUG|INFO|WARN|ERROR)\s+\S+:\s+(.*)$/
const BENIGN_SNIPPETS = [
  'state db missing rollout path for thread',
  'state db record_discrepancy',
  'falling_back',
]
function classifyStderrLine(rawLine) {
  const line = stripAnsi(rawLine).trim()
  if (!line) return null

  const match = line.match(STDERR_LOG_RE)
  if (match) {
    const level = match[1]
    if (level && level !== 'ERROR') return null            // skip TRACE/DEBUG/INFO/WARN
    if (BENIGN_SNIPPETS.some((s) => line.includes(s))) return null  // skip benign errors
  }

  return { message: line }
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const result = {
    prompt: '',
    cwd: process.cwd(),
    mode: 'agent',
    model: null,
    workspace: null,
    includeThinking: false,
  }
  let i = 0
  while (i < args.length) {
    if (args[i] === '--cwd' && args[i + 1] && !args[i + 1].startsWith('--')) {
      result.cwd = args[i + 1]; i += 2; continue
    }
    if (args[i] === '--mode' && args[i + 1]) {
      if (MODES.includes(args[i + 1])) {
        result.mode = args[i + 1]
      } else {
        out({ success: false, error: `Invalid mode "${args[i + 1]}". Valid modes: ${MODES.join(', ')}` })
        process.exit(1)
      }
      i += 2; continue
    }
    if (args[i] === '--model' && args[i + 1] && !args[i + 1].startsWith('--')) {
      result.model = args[i + 1]; i += 2; continue
    }
    if (args[i] === '--workspace' && args[i + 1] && !args[i + 1].startsWith('--')) {
      result.workspace = args[i + 1]; i += 2; continue
    }
    if (args[i] === '--thinking') {
      result.includeThinking = true; i += 1; continue
    }
    if (args[i] === '--') {
      // Everything after -- is the prompt. spawn() handles this correctly
      // without shell quoting since we pass args as an array (not a shell string).
      result.prompt = args.slice(i + 1).join(' ').trim()
      break
    }
    i += 1
  }
  return result
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n')
}

// ─── Print Mode ──────────────────────────────────────────────────────────────
// Spawns: agent --print --output-format json --trust [--model X] [--workspace X]
//         [--mode M] -- <prompt>
// Note: the Cursor CLI --mode flag only accepts 'plan' and 'ask'.
// Default (no --mode flag) = full agent mode. Never pass '--mode agent'.
// --trust is always passed so non-config-dir cwds (e.g. /tmp) don't block on
// the workspace-trust prompt (which hangs indefinitely in headless --print mode).
// Parses newline-delimited JSON; extracts the last { type: "result" } object.
// Returns only the success result text; all failures are explicit error objects.
function runPrintMode({ prompt, cwd, mode, model, workspace }) {
  return new Promise((resolve) => {
    const agentArgs = ['--print', '--output-format', 'json', '--trust']
    // Only pass --mode for plan/ask; omit entirely for agent mode (CLI default)
    if (mode === 'plan' || mode === 'ask') agentArgs.push('--mode', mode)
    if (model)     agentArgs.push('--model', model)
    if (workspace) agentArgs.push('--workspace', workspace)
    agentArgs.push('--', prompt)

    const child = spawn('agent', agentArgs, {
      cwd,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })

    child.on('close', (code) => {
      // Parse all newline-delimited JSON lines; keep the last type:"result"
      const lines = stdout.split('\n').filter(Boolean)
      let lastResult = null
      for (const line of lines) {
        try {
          const obj = JSON.parse(line)
          if (obj && obj.type === 'result') lastResult = obj
        } catch (_) { /* skip non-JSON noise lines */ }
      }

      if (code === 0 && lastResult && lastResult.subtype === 'success' && lastResult.result != null) {
        resolve({ success: true, result: lastResult.result })
        return
      }

      // Build a readable error message — never return [object Object]
      const stderrClean = stripAnsi(stderr).trim()

      let errMsg
      if (stderrClean) {
        errMsg = stderrClean
      } else if (lastResult) {
        // lastResult exists but subtype is 'error' or unknown — serialize it
        errMsg = `Agent returned: ${JSON.stringify(lastResult)}`
      } else if (code !== 0) {
        errMsg = `Exit code ${code}. Ensure Cursor CLI is on PATH (agent --version) and authenticated (agent login or CURSOR_API_KEY).`
      } else {
        errMsg = 'No success result in output.'
      }

      resolve({ success: false, error: errMsg })
    })

    child.on('error', (err) => {
      resolve({ success: false, error: `Failed to spawn agent: ${err.message}` })
    })
  })
}

// ─── ACP Mode ────────────────────────────────────────────────────────────────
// Spawns: agent acp
// Uses JSON-RPC 2.0 over stdio. Handles:
//   - Responses:       { id, result } or { id, error }
//   - Notifications:  { method, params } (no id)
//   - Server requests: { id, method, params } → auto-allow permissions
//
// Collects agent_message_chunk → result text; agent_thinking → thinking array.
// Each pending request has a 20 s timeout (matching t3code reference).
//
// NOTE: --model and --workspace are NOT forwarded in ACP mode — the Cursor ACP
// protocol does not expose a model selection field in session/new or session/prompt.
// The agent uses the account's configured default model.
const ACP_REQUEST_TIMEOUT_MS = 20_000

function runAcpMode({ prompt, cwd }) {
  return new Promise((resolve) => {
    const child = spawn('agent', ['acp', '--trust'], {
      cwd,
      shell: false,
      // Use 'pipe' for stderr so we capture and classify errors rather than
      // letting them spill to the terminal.
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const rl = createInterface({ input: child.stdout, crlfDelay: Infinity })
    let nextId = 1
    const pending = new Map()   // id → { resolve, reject, timer, method }
    const chunks = []           // agent message text deltas
    const thinking = []         // agent thinking text deltas
    const stderrLines = []      // classified real stderr lines
    let settled = false

    // Settle exactly once — ignore subsequent calls.
    function settle(result) {
      if (settled) return
      settled = true
      cleanup()
      resolve(result)
    }

    function cleanup() {
      // Reject all outstanding pending requests
      for (const waiter of pending.values()) {
        clearTimeout(waiter.timer)
        waiter.reject(new Error('Session ended before response received.'))
      }
      pending.clear()
      try { child.stdin.end() } catch (_) {}
      try { child.kill() } catch (_) {}
    }

    // Write a JSON-RPC message to stdin — guarded against closed stdin.
    function writeMsg(obj) {
      if (!child.stdin.writable) return
      try {
        child.stdin.write(JSON.stringify(obj) + '\n')
      } catch (_) { /* stdin already closed */ }
    }

    // Send a JSON-RPC request; returns a Promise that resolves/rejects with
    // the response result/error. Times out after ACP_REQUEST_TIMEOUT_MS.
    function send(method, params) {
      const id = nextId++
      writeMsg({ jsonrpc: '2.0', id, method, params })
      return new Promise((res, rej) => {
        const timer = setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id)
            rej(new Error(`Timed out waiting for ${method} (${ACP_REQUEST_TIMEOUT_MS}ms).`))
          }
        }, ACP_REQUEST_TIMEOUT_MS)
        pending.set(id, { resolve: res, reject: rej, timer, method })
      })
    }

    // Send a JSON-RPC response (to a server-initiated request).
    function respond(id, result) {
      writeMsg({ jsonrpc: '2.0', id, result })
    }

    // ── Stdout line handler ──
    rl.on('line', (line) => {
      let msg
      try { msg = JSON.parse(line) } catch (_) { return }

      // Response to one of our requests (has id, no method)
      if (msg.id != null && !('method' in msg)) {
        const waiter = pending.get(msg.id)
        if (waiter) {
          clearTimeout(waiter.timer)
          pending.delete(msg.id)
          if (msg.error) {
            waiter.reject(Object.assign(new Error(msg.error.message || 'JSON-RPC error'), { code: msg.error.code }))
          } else {
            waiter.resolve(msg.result)
          }
        }
        return
      }

      if (!msg.method) return

      // Notification (no id) — session/update carries streaming content
      if (msg.id == null) {
        if (msg.method === 'session/update') {
          const update = msg.params?.update
          if (!update) return
          // agent_message_chunk → result text
          if (update.sessionUpdate === 'agent_message_chunk' && update.content?.text) {
            chunks.push(update.content.text)
          }
          // agent_thinking → thinking array
          if (update.sessionUpdate === 'agent_thinking' && update.content?.text) {
            thinking.push(update.content.text)
          }
        }
        return
      }

      // Server-initiated request (has both id and method)
      if (msg.method === 'session/request_permission') {
        // Auto-allow all permission requests (equivalent to --force in print mode)
        respond(msg.id, { outcome: { outcome: 'selected', optionId: 'allow-once' } })
        return
      }

      // Unknown server request — respond with method-not-found
      writeMsg({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `Unsupported method: ${msg.method}` } })
    })

    // ── Stderr handler — capture and classify ──
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => {
      for (const rawLine of chunk.split(/\r?\n/)) {
        const classified = classifyStderrLine(rawLine)
        if (classified) stderrLines.push(classified.message)
      }
    })

    // ── Process close — settle if we haven't already ──
    // Use 'close' (not 'exit') so stdio streams are fully flushed before we
    // read stderrLines and chunks — 'exit' fires before streams close.
    child.on('close', (code, signal) => {
      if (!settled) {
        const stderrMsg = stderrLines.join('\n').trim()
        settle({
          success: false,
          error: stderrMsg || `agent acp exited unexpectedly (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`,
        })
      }
    })

    child.on('error', (err) => {
      settle({ success: false, error: `Failed to spawn agent acp: ${err.message}` })
    })

    // ── Main ACP flow ──
    const run = async () => {
      try {
        await send('initialize', {
          protocolVersion: 1,
          clientCapabilities: {
            fs: { readTextFile: false, writeTextFile: false },
            terminal: false,
          },
          clientInfo: { name: 'run-cursor-agent', version: '0.2.0' },
        })

        await send('authenticate', { methodId: 'cursor_login' })

        const { sessionId } = await send('session/new', { cwd, mcpServers: [] })

        await send('session/prompt', {
          sessionId,
          prompt: [{ type: 'text', text: prompt }],
        })

        // Yield to the event loop so any pending readline 'line' events that
        // arrived in the same pipe buffer as the session/prompt response are
        // processed before we join chunks. This prevents a streaming race where
        // final notifications arrive slightly after the response.
        await new Promise((r) => setImmediate(r))

        const resultText = chunks.join('')
        settle({
          success: true,
          result: resultText || '(Agent completed with no text output.)',
          ...(thinking.length ? { thinking } : {}),
        })
      } catch (err) {
        const stderrMsg = stderrLines.join('\n').trim()
        settle({
          success: false,
          error: stderrMsg || err?.message || String(err),
        })
      }
    }

    run()
  })
}

// ─── Entry point ─────────────────────────────────────────────────────────────
async function main() {
  const { prompt, cwd, mode, model, workspace, includeThinking } = parseArgs(process.argv)

  if (!prompt) {
    out({ success: false, error: 'Missing prompt. Use: run-cursor-agent.js -- "your prompt"' })
    process.exitCode = 1
    return
  }

  // model and workspace are not supported in ACP mode — reject early with a
  // clear error rather than silently ignoring them.
  if (includeThinking && (model || workspace)) {
    out({
      success: false,
      error: '--model and --workspace are not supported in ACP (--thinking) mode. ' +
             'Remove --model/--workspace or remove --thinking to use print mode.',
    })
    process.exitCode = 1
    return
  }

  const result = includeThinking
    ? await runAcpMode({ prompt, cwd })
    : await runPrintMode({ prompt, cwd, mode, model, workspace })

  out(result)
  if (!result.success) process.exitCode = 1
}

main()
