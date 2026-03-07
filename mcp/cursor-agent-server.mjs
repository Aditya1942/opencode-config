#!/usr/bin/env node

/**
 * Cursor Agent MCP Server
 *
 * Wraps the Cursor CLI (`agent`) in print mode for non-interactive automation.
 * Similar to claude-code MCP but for Cursor's agent command.
 *
 * Requires: Cursor CLI installed (curl https://cursor.com/install -fsS | bash)
 * Binary: `agent` (or CURSOR_AGENT_BIN env)
 */

import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const PROTOCOL_VERSION = '2025-06-18'
const SERVER_INFO = {
  name: 'cursor-agent',
  title: 'Cursor Agent CLI',
  version: '0.1.0',
}

const JSON_RPC_VERSION = '2.0'
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000
const OUTPUT_FORMATS = ['text', 'json', 'stream-json']
const CURSOR_MODES = ['agent', 'plan', 'ask']

const SHARED_PROPERTIES = {
  cwd: {
    type: 'string',
    description: 'Working directory (workspace) for the agent. Defaults to process cwd.',
  },
  model: {
    type: 'string',
    description: 'Model to use. Example: gpt-5.2, claude-sonnet-4.',
  },
  mode: {
    type: 'string',
    enum: CURSOR_MODES,
    description: 'Agent mode: agent (full), plan (planning only), ask (read-only).',
  },
  outputFormat: {
    type: 'string',
    enum: OUTPUT_FORMATS,
    description: 'Output format: text, json, or stream-json. Default: stream-json for task tools.',
  },
  sandbox: {
    type: 'string',
    enum: ['enabled', 'disabled'],
    description: 'Sandbox mode for command execution.',
  },
  timeoutMs: {
    type: 'integer',
    minimum: 1000,
    description: 'Process timeout in milliseconds. Default: 600000.',
  },
}

const TOOL_DEFINITIONS = [
  {
    name: 'list_modes',
    title: 'List Cursor Modes',
    description: 'List available Cursor agent modes (agent, plan, ask).',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'plan_task',
    title: 'Plan Task With Cursor Agent',
    description: 'Create an implementation plan with Cursor CLI in plan mode (read-only planning).',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task to plan.' },
        context: { type: 'string', description: 'Optional extra context.' },
        ...SHARED_PROPERTIES,
      },
      required: ['task'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: 'execute_task',
    title: 'Execute Task With Cursor Agent',
    description: 'Execute a coding task with Cursor CLI in agent mode (full tool access).',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task to execute.' },
        plan: { type: 'string', description: 'Optional plan to follow.' },
        context: { type: 'string', description: 'Optional extra context.' },
        ...SHARED_PROPERTIES,
      },
      required: ['task'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: 'run_prompt',
    title: 'Run Raw Cursor Agent Prompt',
    description: 'Low-level wrapper: agent -p "<prompt>" with model, workspace, and mode controls.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt to send to Cursor Agent.' },
        ...SHARED_PROPERTIES,
      },
      required: ['prompt'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
]

function optionalString(value) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') throw new Error('Expected a string value')
  return value.trim()
}

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`"${fieldName}" must be a non-empty string`)
  }
  return value.trim()
}

function ensureEnum(value, fieldName, allowedValues) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw new Error(`"${fieldName}" must be one of: ${allowedValues.join(', ')}`)
  }
  return value
}

function ensureInteger(value, fieldName) {
  if (value === undefined) return undefined
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`"${fieldName}" must be a positive integer`)
  }
  return value
}

async function resolveDirectory(candidate, baseDirectory, fieldName) {
  const resolvedPath = path.resolve(baseDirectory, requireString(candidate, fieldName))
  const directoryStats = await stat(resolvedPath).catch(() => {
    throw new Error(`"${fieldName}" does not exist: ${resolvedPath}`)
  })
  if (!directoryStats.isDirectory()) {
    throw new Error(`"${fieldName}" is not a directory: ${resolvedPath}`)
  }
  return resolvedPath
}

function buildAgentArgs({ prompt, mode, model, workspace, outputFormat, sandbox, force }) {
  const args = ['-p', prompt, '--trust', '--approve-mcps']
  if (force) args.push('--force')
  if (mode) args.push('--mode', mode)
  if (model) args.push('--model', model)
  if (workspace) args.push('--workspace', workspace)
  if (outputFormat) args.push('--output-format', outputFormat)
  if (sandbox) args.push('--sandbox', sandbox)
  return args
}

function safeJsonParse(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractPrimaryText(value) {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return undefined
  if (typeof value.result === 'string') return value.result
  if (typeof value.text === 'string') return value.text
  if (typeof value.output === 'string') return value.output
  if (Array.isArray(value.content)) {
    const parts = value.content
      .map((item) => (item?.text ?? item))
      .filter(Boolean)
    if (parts.length) return parts.join('\n\n')
  }
  return undefined
}

function clipText(value, maxLength = 160) {
  if (typeof value !== 'string') return ''
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3)}...`
}

async function runAgentProcess({ args, cwd, timeoutMs }) {
  const command = process.env.CURSOR_AGENT_BIN || 'agent'

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let timedOut = false

    const timeoutHandle = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 2000).unref()
    }, timeoutMs)

    child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk) => { stderr += chunk.toString() })

    child.on('error', (error) => {
      clearTimeout(timeoutHandle)
      resolve({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        parsedOutput: null,
      })
    })

    child.on('close', (exitCode) => {
      clearTimeout(timeoutHandle)
      const parsedOutput = safeJsonParse(stdout.trim())
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr: stderr.trim(),
        parsedOutput,
      })
    })
  })
}

function formatToolResult({ toolName, prompt, cwd, model, mode, args, exitCode, stdout, stderr, parsedOutput }) {
  const parsed = safeJsonParse(stdout?.trim())
  const assistantText = extractPrimaryText(parsed ?? parsedOutput) ?? stdout?.trim()
  const header = [
    `[${toolName}]`,
    `model: ${model ?? 'default'}`,
    `mode: ${mode ?? 'agent'}`,
    `cwd: ${cwd}`,
    `exit_code: ${exitCode}`,
  ].join('\n')
  const textSections = [header, assistantText || stdout?.trim(), stderr ? `stderr:\n${stderr}` : ''].filter(Boolean)
  const isError = exitCode !== 0
  return {
    isError,
    content: [{ type: 'text', text: textSections.join('\n\n') }],
    structuredContent: {
      toolName,
      model: model ?? null,
      mode: mode ?? null,
      cwd,
      command: process.env.CURSOR_AGENT_BIN || 'agent',
      args,
      prompt,
      exitCode,
      assistantText: assistantText || null,
      stderr: stderr || null,
      stdout: stdout?.trim() || null,
      parsedOutput: parsed ?? parsedOutput,
    },
  }
}

async function runAgentTask(rawArgs) {
  const prompt = requireString(rawArgs.prompt, 'prompt')
  const mode = ensureEnum(rawArgs.mode, 'mode', CURSOR_MODES)
  const model = optionalString(rawArgs.model)
  const outputFormat = ensureEnum(rawArgs.outputFormat, 'outputFormat', OUTPUT_FORMATS) ?? 'stream-json'
  const sandbox = ensureEnum(rawArgs.sandbox, 'sandbox', ['enabled', 'disabled'])
  const timeoutMs = ensureInteger(rawArgs.timeoutMs, 'timeoutMs') ?? DEFAULT_TIMEOUT_MS
  const baseDirectory = process.cwd()
  const cwd = rawArgs.cwd
    ? await resolveDirectory(rawArgs.cwd, baseDirectory, 'cwd')
    : baseDirectory

  const args = buildAgentArgs({
    prompt,
    mode,
    model,
    workspace: cwd,
    outputFormat,
    sandbox,
    force: rawArgs.toolName === 'execute_task',
  })

  const result = await runAgentProcess({ args, cwd, timeoutMs })

  return formatToolResult({
    toolName: rawArgs.toolName,
    prompt,
    cwd,
    model,
    mode,
    args,
    ...result,
  })
}

const toolHandlers = {
  async list_modes() {
    const modes = [
      { name: 'agent', description: 'Full access to all tools for complex coding tasks' },
      { name: 'plan', description: 'Design approach before coding, clarifying questions' },
      { name: 'ask', description: 'Read-only exploration without making changes' },
    ]
    return {
      isError: false,
      content: [{
        type: 'text',
        text: ['[list_modes]', ...modes.map((m) => `- ${m.name}: ${m.description}`)].join('\n'),
      }],
      structuredContent: { modes },
    }
  },

  async plan_task(args) {
    const task = requireString(args.task, 'task')
    const context = optionalString(args.context)
    const prompt = [
      'Create a concrete implementation plan for the task below.',
      'Return a concise numbered plan with assumptions, risks, and verification steps.',
      '',
      `Task: ${task}`,
      context ? `Context:\n${context}` : '',
    ].filter(Boolean).join('\n')

    return runAgentTask({
      ...args,
      prompt,
      mode: 'plan',
      toolName: 'plan_task',
    })
  },

  async execute_task(args) {
    const task = requireString(args.task, 'task')
    const context = optionalString(args.context)
    const plan = optionalString(args.plan)
    const prompt = [
      'Execute the task below using Cursor Agent.',
      'Prefer small, verifiable changes and summarize what you changed.',
      '',
      `Task: ${task}`,
      plan ? `Plan:\n${plan}` : '',
      context ? `Context:\n${context}` : '',
    ].filter(Boolean).join('\n')

    return runAgentTask({
      ...args,
      prompt,
      mode: args.mode ?? 'agent',
      toolName: 'execute_task',
    })
  },

  async run_prompt(args) {
    return runAgentTask({
      ...args,
      prompt: requireString(args.prompt, 'prompt'),
      toolName: 'run_prompt',
    })
  },
}

function sendMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function sendResponse(id, result) {
  sendMessage({ jsonrpc: JSON_RPC_VERSION, id, result })
}

function sendError(id, code, message, data) {
  sendMessage({
    jsonrpc: JSON_RPC_VERSION,
    id,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  })
}

async function handleRequest(message) {
  const { id, method, params = {} } = message
  if (id === undefined) return

  try {
    switch (method) {
      case 'initialize':
        sendResponse(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
        })
        return

      case 'ping':
        sendResponse(id, {})
        return

      case 'tools/list':
        sendResponse(id, { tools: TOOL_DEFINITIONS })
        return

      case 'tools/call': {
        const toolName = requireString(params.name, 'name')
        const handler = toolHandlers[toolName]
        if (!handler) {
          sendError(id, -32602, `Unknown tool: ${toolName}`)
          return
        }
        const result = await handler(params.arguments ?? {})
        sendResponse(id, result)
        return
      }

      default:
        sendError(id, -32601, `Method not found: ${method}`)
    }
  } catch (error) {
    sendError(id, -32603, error instanceof Error ? error.message : 'Internal server error')
  }
}

let buffer = ''
let pendingRequests = 0
let inputEnded = false

function maybeExit() {
  if (inputEnded && pendingRequests === 0) process.exit(0)
}

process.stdin.setEncoding('utf8')
process.stdin.on('data', async (chunk) => {
  buffer += chunk
  const messages = buffer.split('\n')
  buffer = messages.pop() ?? ''

  for (const line of messages) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    let message
    try {
      message = JSON.parse(trimmedLine)
    } catch {
      process.stderr.write(`Invalid JSON-RPC message: ${trimmedLine}\n`)
      continue
    }

    if (message.id === undefined) continue

    pendingRequests += 1
    handleRequest(message)
      .catch((err) => process.stderr.write(`Request failed: ${err.message}\n`))
      .finally(() => {
        pendingRequests -= 1
        maybeExit()
      })
  }
})

process.stdin.on('end', () => {
  inputEnded = true
  maybeExit()
})
