/**
 * Claude Code MCP Usage Tracker Hook
 *
 * Records every invocation of the claude-code MCP tools (plan_task, execute_task,
 * run_skill, run_prompt, list_profiles, list_agents, list_bridge_prompts) and
 * persists them to .opencode/claude-code-usage.json for usage and quota awareness.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const USAGE_FILE_NAME = 'claude-code-usage.json'
const USAGE_VERSION = 1

const CLAUDE_CODE_TOOL_NAMES = [
  'plan_task',
  'execute_task',
  'run_skill',
  'run_prompt',
  'list_profiles',
  'list_agents',
  'list_bridge_prompts',
]

function isClaudeCodeTool(tool) {
  if (typeof tool !== 'string' || !tool.trim()) return false
  const normalized = tool.trim()
  if (/claude[-_]?code/i.test(normalized)) return true
  return CLAUDE_CODE_TOOL_NAMES.some(
    (name) =>
      normalized === name ||
      normalized.endsWith('.' + name) ||
      normalized.endsWith('_' + name)
  )
}

/**
 * @param {import('@opencode-ai/plugin').PluginInput} ctx
 * @param {{ usageDir?: string }} options
 */
export function createClaudeCodeUsageTrackerHook(ctx, options = {}) {
  const directory = ctx.directory ?? process.cwd()
  const usageDir = options.usageDir ?? join(directory, '.opencode')
  const usagePath = join(usageDir, USAGE_FILE_NAME)

  const pendingByCallId = new Map()

  const ensureUsageDir = async () => {
    try {
      await mkdir(usageDir, { recursive: true })
    } catch {
      // Ignore if already exists or permission issues
    }
  }

  const readUsage = async () => {
    try {
      const raw = await readFile(usagePath, 'utf8')
      const data = JSON.parse(raw)
      if (data?.version === USAGE_VERSION && Array.isArray(data.calls)) {
        return data
      }
    } catch {
      // File missing or invalid
    }
    return { version: USAGE_VERSION, calls: [], lastUpdated: null }
  }

  const appendCall = async (record) => {
    await ensureUsageDir()
    const data = await readUsage()
    data.calls.push(record)
    data.lastUpdated = new Date().toISOString()
    await writeFile(usagePath, JSON.stringify(data, null, 2), 'utf8')
  }

  const toolExecuteBefore = async (input) => {
    if (!isClaudeCodeTool(input.tool)) return
    pendingByCallId.set(input.callID, {
      tool: input.tool,
      sessionID: input.sessionID,
      startedAt: new Date().toISOString(),
    })
  }

  const toolExecuteAfter = async (input, output) => {
    if (!isClaudeCodeTool(input.tool)) return
    const pending = pendingByCallId.get(input.callID)
    const startedAt = pending?.startedAt ?? new Date().toISOString()
    pendingByCallId.delete(input.callID)
    const finishedAt = new Date().toISOString()
    const startedMs = new Date(startedAt).getTime()
    const finishedMs = new Date(finishedAt).getTime()
    const durationMs = Number.isFinite(startedMs) && Number.isFinite(finishedMs)
      ? Math.max(0, finishedMs - startedMs)
      : null

    const profile = typeof input.args?.profile === 'string'
      ? input.args.profile
      : undefined

    await appendCall({
      tool: input.tool,
      sessionID: input.sessionID,
      callID: input.callID,
      startedAt,
      finishedAt,
      durationMs,
      profile: profile || null,
    })
  }

  return {
    'tool.execute.before': toolExecuteBefore,
    'tool.execute.after': toolExecuteAfter,
  }
}

export default createClaudeCodeUsageTrackerHook
