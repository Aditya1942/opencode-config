/**
 * Claude Code MCP Quota Gate Hook
 *
 * Before invoking claude-code MCP tools that consume API quota (plan_task,
 * execute_task, run_skill, run_prompt), runs opencode auth status and checks
 * for exhausted quota. If quota is full, throws to abort the call so the
 * agent falls back to local execution.
 *
 * Skip: list_profiles, list_agents, list_bridge_prompts (metadata only).
 * Bypass: Set OPENCODE_SKIP_QUOTA_CHECK=1 to disable.
 */

import { spawn } from 'node:child_process'

const QUOTA_CHECK_TIMEOUT_MS = 10_000

const HEAVY_CLAUDE_CODE_TOOLS = ['plan_task', 'execute_task', 'run_skill', 'run_prompt']

const EXHAUSTION_PATTERNS = [
  /\b0\s*remaining\b/i,
  /\bremaining\s*:\s*0\b/i,
  /\bremaining\s*0\b/i,
  /\bquota\s+exceeded\b/i,
  /\bquota\s+exhausted\b/i,
  /\bno\s+credits\b/i,
  /\b0\s*credits\b/i,
  /\bcredits\s*:\s*0\b/i,
  /\bexhausted\b/i,
  /\brate\s*limit\b/i,
]

function isHeavyClaudeCodeTool(tool) {
  if (typeof tool !== 'string' || !tool.trim()) return false
  const normalized = tool.trim()
  if (/claude[-_]?code/i.test(normalized)) {
    return HEAVY_CLAUDE_CODE_TOOLS.some(
      (name) =>
        normalized.endsWith('.' + name) ||
        normalized.endsWith('_' + name) ||
        normalized === name
    )
  }
  return HEAVY_CLAUDE_CODE_TOOLS.some(
    (name) => normalized === name || normalized.endsWith('.' + name)
  )
}

function looksExhausted(output) {
  if (typeof output !== 'string' || !output.trim()) return false
  return EXHAUSTION_PATTERNS.some((re) => re.test(output))
}

/**
 * Run opencode auth status and return combined stdout+stderr.
 * @returns {Promise<{ output: string; exitCode: number }>}
 */
function runQuotaCheck() {
  return new Promise((resolve) => {
    const child = spawn('opencode', ['auth', 'status'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: QUOTA_CHECK_TIMEOUT_MS,
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (chunk) => { stdout += String(chunk) })
    child.stderr?.on('data', (chunk) => { stderr += String(chunk) })
    child.on('close', (code) => {
      resolve({ output: stdout + '\n' + stderr, exitCode: code ?? -1 })
    })
    child.on('error', () => {
      resolve({ output: '', exitCode: -1 })
    })
  })
}

const FALLBACK_MESSAGE = `[Claude Code MCP] Quota exhausted. Do NOT retry the claude-code MCP. Execute this task locally using your available tools (Read, Write, Grep, Bash, etc.) instead of delegating to claude-code.`

/**
 * @param {import('@opencode-ai/plugin').PluginInput} ctx
 * @param {{ checkCommand?: string[] }} options
 */
export function createClaudeCodeQuotaGateHook(ctx, options = {}) {
  const checkCommand = options.checkCommand ?? ['opencode', 'auth', 'status']

  const toolExecuteBefore = async (input) => {
    if (!isHeavyClaudeCodeTool(input.tool)) return
    if (process.env.OPENCODE_SKIP_QUOTA_CHECK === '1') return

    const { output } = await runQuotaCheck()

    if (looksExhausted(output)) {
      const err = new Error(FALLBACK_MESSAGE)
      err.code = 'QUOTA_EXHAUSTED'
      throw err
    }
  }

  return {
    'tool.execute.before': toolExecuteBefore,
  }
}

export default createClaudeCodeQuotaGateHook
