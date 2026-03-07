#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { access, readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { CLAUDE_CODE_PROFILES } from './claude-code-profiles.mjs'

const PROTOCOL_VERSION = '2025-06-18'
const SERVER_INFO = {
  name: 'claude-code',
  title: 'Claude Code CLI',
  version: '0.2.0',
}

const JSON_RPC_VERSION = '2.0'
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000
const DEFAULT_BRIDGE_SERVER_NAME = 'opencode-bridge'
const OUTPUT_FORMATS = ['text', 'json', 'stream-json']
const INPUT_FORMATS = ['text', 'stream-json']
const EFFORT_LEVELS = ['low', 'medium', 'high']
const PERMISSION_MODES = [
  'default',
  'acceptEdits',
  'plan',
  'dontAsk',
  'auto',
  'bypassPermissions',
]

const SHARED_PROPERTIES = {
  profile: {
    type: 'string',
    description: 'Named Claude system-prompt profile defined by this MCP. Use list_profiles to inspect available values.',
  },
  agent: {
    type: 'string',
    description: 'Claude Code agent to use for this run. Example: Plan, Explore, code-reviewer.',
  },
  agents: {
    description: 'Runtime agent definitions for Claude Code. Provide a JSON object or JSON string compatible with --agents.',
  },
  model: {
    type: 'string',
    description: 'Claude Code model alias or full model name. Example: sonnet, opus, claude-sonnet-4-6.',
  },
  cwd: {
    type: 'string',
    description: 'Working directory to run Claude in. Relative paths resolve from the MCP server process.',
  },
  bridgeOpenCode: {
    type: 'boolean',
    description: 'Expose this OpenCode config repo to Claude Code as runtime subagents and MCP prompt workflows.',
  },
  bridgeServerName: {
    type: 'string',
    description: 'Server name used for the injected OpenCode bridge MCP server.',
  },
  openCodeConfigPath: {
    type: 'string',
    description: 'Path to the OpenCode config JSON to bridge. Defaults to ./opencode.json next to this MCP server.',
  },
  openCodeSkillsDir: {
    type: 'string',
    description: 'Path to the OpenCode skills directory to bridge. Defaults to ./skills next to this MCP server.',
  },
  addDirs: {
    type: 'array',
    description: 'Additional directories Claude may access.',
    items: { type: 'string' },
    default: [],
  },
  systemPrompt: {
    type: 'string',
    description: 'Replaces Claude Code\'s default system prompt for this run.',
  },
  appendSystemPrompt: {
    type: 'string',
    description: 'Appends extra instructions to Claude Code\'s default system prompt.',
  },
  permissionMode: {
    type: 'string',
    enum: PERMISSION_MODES,
    description: 'Claude Code permission mode.',
  },
  dangerouslySkipPermissions: {
    type: 'boolean',
    description: 'Immediately bypass all permission checks for this run.',
  },
  allowDangerouslySkipPermissions: {
    type: 'boolean',
    description: 'Expose bypass-permissions as an available option without enabling it by default.',
  },
  allowedTools: {
    type: 'array',
    description: 'Tool patterns that can run without prompting.',
    items: { type: 'string' },
    default: [],
  },
  disallowedTools: {
    type: 'array',
    description: 'Tool patterns removed from Claude\'s available tool set.',
    items: { type: 'string' },
    default: [],
  },
  tools: {
    type: 'array',
    description: 'Restrict Claude to the listed tools only.',
    items: { type: 'string' },
    default: [],
  },
  maxTurns: {
    type: 'integer',
    minimum: 1,
    description: 'Maximum agent turns for this run.',
  },
  fallbackModel: {
    type: 'string',
    description: 'Fallback model alias or full model name for print mode.',
  },
  effort: {
    type: 'string',
    enum: EFFORT_LEVELS,
    description: 'Claude Code effort level for the session.',
  },
  pluginDirs: {
    type: 'array',
    description: 'Claude Code plugin directories to load for this run.',
    items: { type: 'string' },
    default: [],
  },
  settings: {
    description: 'Additional Claude Code settings as a JSON object, JSON string, or path to a settings file.',
  },
  settingSources: {
    type: 'array',
    description: 'Setting sources to load. Example: ["user", "project", "local"].',
    items: { type: 'string' },
    default: [],
  },
  outputFormat: {
    type: 'string',
    enum: OUTPUT_FORMATS,
    description: 'Print output format. Task tools default to stream-json so progress events can be surfaced.',
  },
  inputFormat: {
    type: 'string',
    enum: INPUT_FORMATS,
    description: 'Print input format.',
  },
  includePartialMessages: {
    type: 'boolean',
    description: 'Include partial chunks in stream-json output.',
  },
  replayUserMessages: {
    type: 'boolean',
    description: 'Re-emit stream-json user messages to stdout.',
  },
  jsonSchema: {
    description: 'Structured output schema as a JSON object or JSON string.',
  },
  maxBudgetUsd: {
    type: 'number',
    minimum: 0,
    description: 'Maximum budget for API calls in print mode.',
  },
  continueMostRecent: {
    type: 'boolean',
    description: 'Continue the most recent Claude Code session in the working directory.',
  },
  resumeSession: {
    type: 'string',
    description: 'Resume a specific Claude Code session by session ID or search term.',
  },
  sessionId: {
    type: 'string',
    description: 'Explicit session UUID to use for this run.',
  },
  forkSession: {
    type: 'boolean',
    description: 'Fork the resumed session into a new conversation.',
  },
  noSessionPersistence: {
    type: 'boolean',
    description: 'Disable session persistence for this print-mode run.',
  },
  disableSlashCommands: {
    type: 'boolean',
    description: 'Disable Claude Code skills and slash commands for this run.',
  },
  mcpConfig: {
    type: 'array',
    description: 'Additional MCP config files or inline JSON strings to load into Claude Code.',
    items: { type: 'string' },
    default: [],
  },
  strictMcpConfig: {
    type: 'boolean',
    description: 'Only use MCP servers from mcpConfig, ignoring other Claude Code MCP settings.',
  },
  debugFilter: {
    type: 'string',
    description: 'Enable debug logging with an optional category filter.',
  },
  debugFile: {
    type: 'string',
    description: 'Write Claude Code debug logs to a file path.',
  },
  verbose: {
    type: 'boolean',
    description: 'Enable verbose mode for Claude Code.',
  },
  betas: {
    type: 'array',
    description: 'Claude Code beta headers to send with API requests.',
    items: { type: 'string' },
    default: [],
  },
  timeoutMs: {
    type: 'integer',
    minimum: 1000,
    description: 'Process timeout in milliseconds. Defaults to 600000.',
  },
}

const TOOL_DEFINITIONS = [
  {
    name: 'list_profiles',
    title: 'List Claude Profiles',
    description: 'List named Claude system-prompt profiles exposed by this MCP.',
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
    name: 'list_agents',
    title: 'List Claude Code Agents',
    description: 'List built-in, plugin, and configured Claude Code agents visible to this run.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: SHARED_PROPERTIES.cwd,
        settingSources: SHARED_PROPERTIES.settingSources,
        settings: SHARED_PROPERTIES.settings,
        pluginDirs: SHARED_PROPERTIES.pluginDirs,
        timeoutMs: SHARED_PROPERTIES.timeoutMs,
      },
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
    name: 'list_bridge_prompts',
    title: 'List OpenCode Bridge Prompts',
    description: 'List OpenCode skills and command aliases exposed to Claude Code through the runtime bridge.',
    inputSchema: {
      type: 'object',
      properties: {
        bridgeServerName: SHARED_PROPERTIES.bridgeServerName,
        openCodeConfigPath: SHARED_PROPERTIES.openCodeConfigPath,
        openCodeSkillsDir: SHARED_PROPERTIES.openCodeSkillsDir,
      },
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
    title: 'Plan Task With Claude Code',
    description: 'Create an implementation plan with Claude Code CLI in print mode. Defaults to permissionMode=plan.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Task to plan.',
        },
        context: {
          type: 'string',
          description: 'Optional extra context to include with the planning prompt.',
        },
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
    title: 'Execute Task With Claude Code',
    description: 'Execute a coding task with Claude Code CLI in print mode. Defaults to permissionMode=acceptEdits.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Task to execute.',
        },
        plan: {
          type: 'string',
          description: 'Optional plan or checklist Claude should follow while executing.',
        },
        context: {
          type: 'string',
          description: 'Optional extra context to include with the execution prompt.',
        },
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
    name: 'run_skill',
    title: 'Run Claude Code Skill',
    description: 'Invoke a Claude Code skill or slash command explicitly, such as /review or /batch.',
    inputSchema: {
      type: 'object',
      properties: {
        skillName: {
          type: 'string',
          description: 'Skill or slash-command name without the leading slash.',
        },
        arguments: {
          type: 'string',
          description: 'Arguments to pass after the skill name.',
        },
        context: {
          type: 'string',
          description: 'Optional follow-up context after the slash command.',
        },
        ...SHARED_PROPERTIES,
      },
      required: ['skillName'],
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
    title: 'Run Raw Claude Code Prompt',
    description: 'Low-level wrapper around claude -p with model, directory, prompt, and tool controls.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Prompt to send to Claude Code.',
        },
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

const toolHandlers = {
  async list_profiles() {
    const profiles = Object.entries(CLAUDE_CODE_PROFILES).map(([name, profile]) => ({
      name,
      description: profile.description,
    }))

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: [
            '[list_profiles]',
            ...profiles.map((profile) => `- ${profile.name}: ${profile.description}`),
          ].join('\n'),
        },
      ],
      structuredContent: {
        profiles,
      },
    }
  },

  async list_agents(args) {
    const baseDirectory = process.cwd()
    const cwd = args.cwd
      ? await resolveDirectory(args.cwd, baseDirectory, 'cwd')
      : baseDirectory
    const pluginDirs = await Promise.all(
      ensureStringArray(args.pluginDirs, 'pluginDirs').map((directory) =>
        resolveDirectory(directory, cwd, 'pluginDirs')
      )
    )
    const settingSources = ensureStringArray(args.settingSources, 'settingSources')
    const settings = ensureJsonOrString(args.settings, 'settings')
    const timeoutMs = ensureInteger(args.timeoutMs, 'timeoutMs') ?? DEFAULT_TIMEOUT_MS
    const commandArgs = ['agents']

    if (pluginDirs.length > 0) {
      commandArgs.push('--plugin-dir', ...pluginDirs)
    }

    if (settingSources.length > 0) {
      commandArgs.push('--setting-sources', settingSources.join(','))
    }

    if (settings) {
      commandArgs.push('--settings', settings)
    }

    const result = await runClaudeProcess({
      args: commandArgs,
      cwd,
      timeoutMs,
    })

    return formatToolResult({
      toolName: 'list_agents',
      prompt: '',
      cwd,
      model: null,
      args: commandArgs,
      ...result,
    })
  },

  async list_bridge_prompts(args) {
    const bridge = await loadOpenCodeBridge(args)
    const promptLines = bridge.prompts
      .map((prompt) => `- ${prompt.name} (${prompt.slashCommand}): ${prompt.description}`)
      .join('\n')

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: [
            '[list_bridge_prompts]',
            `server: ${bridge.serverName}`,
            `config: ${bridge.configPath}`,
            `skills_dir: ${bridge.skillsDir}`,
            '',
            'Prompts:',
            promptLines || 'No bridge prompts found.',
          ].join('\n'),
        },
      ],
      structuredContent: {
        serverName: bridge.serverName,
        configPath: bridge.configPath,
        skillsDir: bridge.skillsDir,
        prompts: bridge.prompts,
      },
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

    return runClaudeTask({
      ...args,
      prompt,
      permissionMode: args.permissionMode ?? 'plan',
      toolName: 'plan_task',
    })
  },

  async execute_task(args) {
    const task = requireString(args.task, 'task')
    const context = optionalString(args.context)
    const plan = optionalString(args.plan)
    const prompt = [
      'Execute the task below using Claude Code.',
      'Prefer small, verifiable changes and summarize what you changed.',
      '',
      `Task: ${task}`,
      plan ? `Plan:\n${plan}` : '',
      context ? `Context:\n${context}` : '',
    ].filter(Boolean).join('\n')

    return runClaudeTask({
      ...args,
      prompt,
      permissionMode: args.permissionMode ?? 'acceptEdits',
      toolName: 'execute_task',
    })
  },

  async run_skill(args) {
    const skillName = requireString(args.skillName, 'skillName').replace(/^\/+/, '')
    const skillArguments = optionalString(args.arguments)
    const context = optionalString(args.context)
    let slashCommand = `/${skillName}${skillArguments ? ` ${skillArguments}` : ''}`

    const bridgeEnabled = args.bridgeOpenCode ?? true
    if (bridgeEnabled) {
      const bridge = await loadOpenCodeBridge(args)
      const entry = findBridgePromptEntry(bridge, skillName)

      if (entry) {
        slashCommand = `${entry.slashCommand}${skillArguments ? ` ${skillArguments}` : ''}`
      }
    }

    const prompt = [
      slashCommand,
      context ?? '',
    ].filter(Boolean).join('\n\n')

    return runClaudeTask({
      ...args,
      prompt,
      toolName: 'run_skill',
    })
  },

  async run_prompt(args) {
    return runClaudeTask({
      ...args,
      prompt: requireString(args.prompt, 'prompt'),
      toolName: 'run_prompt',
    })
  },
}

function optionalString(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error('Expected a string value')
  }

  return value
}

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`"${fieldName}" must be a non-empty string`)
  }

  return value.trim()
}

function ensureStringArray(value, fieldName) {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error(`"${fieldName}" must be an array of strings`)
  }

  for (const item of value) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new Error(`"${fieldName}" must contain only non-empty strings`)
    }
  }

  return value.map((item) => item.trim())
}

function ensureInteger(value, fieldName) {
  if (value === undefined) {
    return undefined
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`"${fieldName}" must be a positive integer`)
  }

  return value
}

function ensureNumber(value, fieldName) {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    throw new Error(`"${fieldName}" must be a non-negative number`)
  }

  return value
}

function ensureBoolean(value, fieldName) {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'boolean') {
    throw new Error(`"${fieldName}" must be a boolean`)
  }

  return value
}

function ensureEnum(value, fieldName, allowedValues) {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw new Error(`"${fieldName}" must be one of: ${allowedValues.join(', ')}`)
  }

  return value
}

function ensurePermissionMode(value) {
  if (value === undefined) {
    return undefined
  }

  if (!PERMISSION_MODES.includes(value)) {
    throw new Error(`"permissionMode" must be one of: ${PERMISSION_MODES.join(', ')}`)
  }

  return value
}

function ensureJsonOrString(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value === 'string') {
    return requireString(value, fieldName)
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  throw new Error(`"${fieldName}" must be a JSON object or non-empty string`)
}

async function resolveDirectory(candidate, baseDirectory, fieldName) {
  const resolvedPath = path.resolve(baseDirectory, requireString(candidate, fieldName))
  const directoryStats = await stat(resolvedPath).catch(() => {
    throw new Error(`"${fieldName}" does not exist: ${resolvedPath}`)
  })

  if (!directoryStats.isDirectory()) {
    throw new Error(`"${fieldName}" is not a directory: ${resolvedPath}`)
  }

  await access(resolvedPath)

  return resolvedPath
}

async function resolveFile(candidate, baseDirectory, fieldName) {
  const resolvedPath = path.resolve(baseDirectory, requireString(candidate, fieldName))
  const fileStats = await stat(resolvedPath).catch(() => {
    throw new Error(`"${fieldName}" does not exist: ${resolvedPath}`)
  })

  if (!fileStats.isFile()) {
    throw new Error(`"${fieldName}" is not a file: ${resolvedPath}`)
  }

  await access(resolvedPath)

  return resolvedPath
}

function normalizeSlashIdentifier(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function createBridgeSlashCommand(serverName, promptName) {
  return `mcp__${normalizeSlashIdentifier(serverName)}__${normalizeSlashIdentifier(promptName)}`
}

function parseSimpleFrontmatter(documentText) {
  if (!documentText.startsWith('---\n')) {
    return { attributes: {}, body: documentText.trim() }
  }

  const endIndex = documentText.indexOf('\n---\n', 4)
  if (endIndex === -1) {
    return { attributes: {}, body: documentText.trim() }
  }

  const frontmatter = documentText.slice(4, endIndex)
  const body = documentText.slice(endIndex + 5).trim()
  const attributes = {}

  for (const rawLine of frontmatter.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()
    const unquotedValue = rawValue.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    attributes[key] = unquotedValue
  }

  return { attributes, body }
}

async function walkFiles(directory, matcher, results = []) {
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      await walkFiles(entryPath, matcher, results)
      continue
    }

    if (entry.isFile() && matcher(entryPath, entry.name)) {
      results.push(entryPath)
    }
  }

  return results
}

async function collectOpenCodeSkills(skillsDirectory) {
  const skillFiles = await walkFiles(
    skillsDirectory,
    (_entryPath, entryName) => entryName === 'SKILL.md'
  )
  const skills = []

  for (const skillFile of skillFiles.sort()) {
    const documentText = await readFile(skillFile, 'utf8')
    const { attributes, body } = parseSimpleFrontmatter(documentText)
    const name = typeof attributes.name === 'string' && attributes.name.trim()
      ? attributes.name.trim()
      : path.basename(path.dirname(skillFile))
    const description = typeof attributes.description === 'string'
      ? attributes.description.trim()
      : `OpenCode skill from ${skillFile}`

    skills.push({
      kind: 'skill',
      name,
      description,
      filePath: skillFile,
      body,
    })
  }

  return skills
}

function buildPromptText({ entry, input, skillLookup }) {
  if (entry.kind === 'skill') {
    return [
      `Use the "${entry.name}" workflow below.`,
      '',
      entry.body,
      input ? `Additional context:\n${input}` : '',
    ].filter(Boolean).join('\n')
  }

  if (entry.kind === 'command' && entry.targetSkillName) {
    const targetSkill = skillLookup.get(entry.targetSkillName)

    if (targetSkill) {
      return [
        entry.template,
        '',
        `Referenced skill: ${targetSkill.name}`,
        '',
        targetSkill.body,
        input ? `Additional context:\n${input}` : '',
      ].filter(Boolean).join('\n')
    }
  }

  return [
    entry.template ?? entry.description,
    input ? `Additional context:\n${input}` : '',
  ].filter(Boolean).join('\n')
}

function extractTargetSkillName(template) {
  if (typeof template !== 'string') {
    return null
  }

  const skillReference = template.match(/my-skills:([a-z0-9-]+)/i)
  if (skillReference) {
    return skillReference[1]
  }

  return null
}

async function loadOpenCodeBridge(rawArgs = {}) {
  const baseDirectory = process.cwd()
  const serverName = optionalString(rawArgs.bridgeServerName)
    || process.env.OPENCODE_BRIDGE_SERVER_NAME
    || DEFAULT_BRIDGE_SERVER_NAME
  const configPath = rawArgs.openCodeConfigPath
    ? await resolveFile(rawArgs.openCodeConfigPath, baseDirectory, 'openCodeConfigPath')
    : process.env.OPENCODE_CONFIG_PATH
      ? await resolveFile(process.env.OPENCODE_CONFIG_PATH, baseDirectory, 'OPENCODE_CONFIG_PATH')
      : await resolveFile('opencode.json', baseDirectory, 'openCodeConfigPath')
  const skillsDir = rawArgs.openCodeSkillsDir
    ? await resolveDirectory(rawArgs.openCodeSkillsDir, baseDirectory, 'openCodeSkillsDir')
    : process.env.OPENCODE_SKILLS_DIR
      ? await resolveDirectory(process.env.OPENCODE_SKILLS_DIR, baseDirectory, 'OPENCODE_SKILLS_DIR')
      : await resolveDirectory('skills', baseDirectory, 'openCodeSkillsDir')

  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const skills = await collectOpenCodeSkills(skillsDir)
  const skillLookup = new Map(skills.map((skill) => [skill.name, skill]))
  const commandEntries = Object.entries(config.command ?? {}).map(([name, entry]) => ({
    kind: 'command',
    name,
    description: optionalString(entry?.description) ?? `OpenCode command ${name}`,
    template: optionalString(entry?.template) ?? '',
    targetSkillName: extractTargetSkillName(entry?.template),
  }))

  const prompts = [...skills, ...commandEntries]
    .filter((entry) => entry.name)
    .map((entry) => ({
      name: entry.name,
      description: entry.description,
      slashCommand: `/${createBridgeSlashCommand(serverName, entry.name)}`,
      kind: entry.kind,
    }))

  const promptEntries = new Map()

  for (const entry of [...skills, ...commandEntries]) {
    if (!promptEntries.has(entry.name)) {
      promptEntries.set(entry.name, {
        ...entry,
        slashCommand: `/${createBridgeSlashCommand(serverName, entry.name)}`,
      })
    }
  }

  return {
    serverName,
    configPath,
    skillsDir,
    prompts,
    promptEntries,
    skillLookup,
  }
}

function findBridgePromptEntry(bridge, promptName) {
  const directMatch = bridge.promptEntries.get(promptName)
  if (directMatch) {
    return directMatch
  }

  const normalizedName = normalizeSlashIdentifier(promptName)

  for (const [entryName, entry] of bridge.promptEntries.entries()) {
    if (normalizeSlashIdentifier(entryName) === normalizedName) {
      return entry
    }
  }

  return null
}

function resolveProfile(profileName) {
  if (!profileName) {
    return undefined
  }

  const profile = CLAUDE_CODE_PROFILES[profileName]
  if (!profile) {
    throw new Error(`Unknown profile: ${profileName}`)
  }

  return profile
}

function buildBridgeMcpConfig(bridge) {
  return JSON.stringify({
    mcpServers: {
      [bridge.serverName]: {
        command: process.execPath,
        args: [path.resolve(process.cwd(), 'mcp/claude-code-server.mjs')],
        env: {
          OPENCODE_BRIDGE_MODE: 'prompts-only',
          OPENCODE_BRIDGE_SERVER_NAME: bridge.serverName,
          OPENCODE_CONFIG_PATH: bridge.configPath,
          OPENCODE_SKILLS_DIR: bridge.skillsDir,
        },
      },
    },
  })
}

async function listBridgePromptDefinitions() {
  const bridge = await loadOpenCodeBridge()

  return bridge.prompts.map((prompt) => ({
    name: prompt.name,
    description: prompt.description,
    arguments: [
      {
        name: 'input',
        description: 'Optional extra context to append when invoking this prompt.',
        required: false,
      },
    ],
  }))
}

async function getBridgePromptResponse(params = {}) {
  const promptName = requireString(params.name, 'name')
  const bridge = await loadOpenCodeBridge()
  const entry = findBridgePromptEntry(bridge, promptName)

  if (!entry) {
    throw new Error(`Unknown bridge prompt: ${promptName}`)
  }

  const input = optionalString(params.arguments?.input)
  const text = buildPromptText({
    entry,
    input,
    skillLookup: bridge.skillLookup,
  })

  return {
    description: entry.description,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text,
        },
      },
    ],
  }
}

function buildClaudeArgs({
  prompt,
  agent,
  agents,
  model,
  addDirs,
  systemPrompt,
  appendSystemPrompt,
  permissionMode,
  dangerouslySkipPermissions,
  allowDangerouslySkipPermissions,
  allowedTools,
  disallowedTools,
  tools,
  maxTurns,
  fallbackModel,
  effort,
  pluginDirs,
  settings,
  settingSources,
  outputFormat,
  inputFormat,
  includePartialMessages,
  replayUserMessages,
  jsonSchema,
  maxBudgetUsd,
  continueMostRecent,
  resumeSession,
  sessionId,
  forkSession,
  noSessionPersistence,
  disableSlashCommands,
  mcpConfig,
  strictMcpConfig,
  debugFilter,
  debugFile,
  verbose,
  betas,
}) {
  const args = ['-p', prompt, '--output-format', outputFormat ?? 'json']

  if (agent) {
    args.push('--agent', agent)
  }

  if (agents) {
    args.push('--agents', agents)
  }

  if (model) {
    args.push('--model', model)
  }

  if (addDirs.length > 0) {
    args.push('--add-dir', ...addDirs)
  }

  if (systemPrompt) {
    args.push('--system-prompt', systemPrompt)
  }

  if (appendSystemPrompt) {
    args.push('--append-system-prompt', appendSystemPrompt)
  }

  if (permissionMode) {
    args.push('--permission-mode', permissionMode)
  }

  if (dangerouslySkipPermissions) {
    args.push('--dangerously-skip-permissions')
  }

  if (allowDangerouslySkipPermissions) {
    args.push('--allow-dangerously-skip-permissions')
  }

  if (allowedTools.length > 0) {
    args.push('--allowed-tools', ...allowedTools)
  }

  if (disallowedTools.length > 0) {
    args.push('--disallowed-tools', ...disallowedTools)
  }

  if (tools.length > 0) {
    args.push('--tools', ...tools)
  }

  if (maxTurns) {
    args.push('--max-turns', String(maxTurns))
  }

  if (fallbackModel) {
    args.push('--fallback-model', fallbackModel)
  }

  if (effort) {
    args.push('--effort', effort)
  }

  if (pluginDirs.length > 0) {
    args.push('--plugin-dir', ...pluginDirs)
  }

  if (settings) {
    args.push('--settings', settings)
  }

  if (settingSources.length > 0) {
    args.push('--setting-sources', settingSources.join(','))
  }

  if (inputFormat) {
    args.push('--input-format', inputFormat)
  }

  if (includePartialMessages) {
    args.push('--include-partial-messages')
  }

  if (replayUserMessages) {
    args.push('--replay-user-messages')
  }

  if (jsonSchema) {
    args.push('--json-schema', jsonSchema)
  }

  if (maxBudgetUsd !== undefined) {
    args.push('--max-budget-usd', String(maxBudgetUsd))
  }

  if (continueMostRecent) {
    args.push('--continue')
  }

  if (resumeSession) {
    args.push('--resume', resumeSession)
  }

  if (sessionId) {
    args.push('--session-id', sessionId)
  }

  if (forkSession) {
    args.push('--fork-session')
  }

  if (noSessionPersistence) {
    args.push('--no-session-persistence')
  }

  if (disableSlashCommands) {
    args.push('--disable-slash-commands')
  }

  if (mcpConfig.length > 0) {
    args.push('--mcp-config', ...mcpConfig)
  }

  if (strictMcpConfig) {
    args.push('--strict-mcp-config')
  }

  if (debugFilter) {
    args.push('--debug', debugFilter)
  }

  if (debugFile) {
    args.push('--debug-file', debugFile)
  }

  if (verbose) {
    args.push('--verbose')
  }

  if (betas.length > 0) {
    args.push('--betas', ...betas)
  }

  return args
}

function safeJsonParse(value) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractTextFromContent(content) {
  if (!Array.isArray(content)) {
    return undefined
  }

  const parts = content
    .map((item) => {
      if (typeof item === 'string') {
        return item
      }

      if (item && typeof item === 'object' && typeof item.text === 'string') {
        return item.text
      }

      return undefined
    })
    .filter(Boolean)

  if (parts.length === 0) {
    return undefined
  }

  return parts.join('\n\n')
}

function extractPrimaryText(value) {
  if (typeof value === 'string') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return undefined
  }

  if (typeof value.result === 'string') {
    return value.result
  }

  if (typeof value.text === 'string') {
    return value.text
  }

  if (typeof value.output === 'string') {
    return value.output
  }

  const directContent = extractTextFromContent(value.content)
  if (directContent) {
    return directContent
  }

  const messageContent = extractTextFromContent(value.message?.content)
  if (messageContent) {
    return messageContent
  }

  if (typeof value.result === 'object') {
    const nestedResult = extractPrimaryText(value.result)
    if (nestedResult) {
      return nestedResult
    }
  }

  return undefined
}

function parseJsonLines(value) {
  const trimmed = value.trim()

  if (!trimmed) {
    return []
  }

  return trimmed
    .split('\n')
    .map((line) => safeJsonParse(line.trim()))
    .filter(Boolean)
}

function clipText(value, maxLength = 160) {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 3)}...`
}

function summarizeContentBlock(block) {
  if (!block || typeof block !== 'object') {
    return null
  }

  if (typeof block.text === 'string' && block.text.trim()) {
    return clipText(block.text)
  }

  if (block.type === 'tool_use') {
    const toolName = typeof block.name === 'string' ? block.name : 'unknown-tool'
    return `Tool: ${toolName}`
  }

  if (block.type === 'thinking' || block.type === 'redacted_thinking') {
    return 'Thinking'
  }

  return null
}

function summarizeClaudeEvent(event) {
  if (!event || typeof event !== 'object') {
    return null
  }

  if (event.type === 'system') {
    if (event.subtype === 'init') {
      const model = typeof event.model === 'string' ? event.model : 'default'
      return `Claude Code started (${model})`
    }

    if (typeof event.subtype === 'string') {
      return `System: ${event.subtype}`
    }
  }

  if (event.type === 'assistant') {
    const content = Array.isArray(event.message?.content)
      ? event.message.content
      : Array.isArray(event.content)
        ? event.content
        : []

    for (const block of content) {
      const summary = summarizeContentBlock(block)
      if (summary) {
        return summary
      }
    }

    return 'Assistant updated'
  }

  if (event.type === 'result') {
    const resultText = extractPrimaryText(event)
    return resultText ? clipText(resultText) : 'Claude Code finished'
  }

  if (event.type === 'error') {
    const errorText = typeof event.error === 'string'
      ? event.error
      : typeof event.message === 'string'
        ? event.message
        : 'Claude Code reported an error'
    return clipText(errorText)
  }

  return null
}

function parseClaudeOutput(stdout) {
  const trimmed = stdout.trim()
  if (!trimmed) {
    return {
      parsedOutput: null,
      assistantText: null,
      streamEvents: [],
    }
  }

  const parsedJson = safeJsonParse(trimmed)
  if (parsedJson) {
    return {
      parsedOutput: parsedJson,
      assistantText: extractPrimaryText(parsedJson) ?? null,
      streamEvents: [],
    }
  }

  const streamEvents = parseJsonLines(trimmed)
  if (streamEvents.length === 0) {
    return {
      parsedOutput: null,
      assistantText: null,
      streamEvents: [],
    }
  }

  const finalResult = [...streamEvents].reverse().find((event) => event?.type === 'result') ?? null
  const lastAssistant = [...streamEvents].reverse().find((event) => event?.type === 'assistant') ?? null
  const assistantText = extractPrimaryText(finalResult)
    ?? extractPrimaryText(lastAssistant)
    ?? null

  return {
    parsedOutput: {
      type: 'stream-json',
      events: streamEvents,
      result: finalResult,
    },
    assistantText,
    streamEvents,
  }
}

function formatToolResult({
  toolName,
  prompt,
  cwd,
  model,
  args,
  exitCode,
  stdout,
  stderr,
  parsedOutput,
}) {
  const parsed = parseClaudeOutput(stdout)
  const normalizedParsedOutput = parsed.parsedOutput ?? parsedOutput
  const assistantText = parsed.assistantText
    ?? extractPrimaryText(parsedOutput)
    ?? stdout.trim()
  const header = [
    `[${toolName}]`,
    `model: ${model ?? 'default'}`,
    `cwd: ${cwd}`,
    `exit_code: ${exitCode}`,
  ].join('\n')

  const textSections = [header]

  if (assistantText) {
    textSections.push(assistantText)
  }

  if (!assistantText && stdout.trim()) {
    textSections.push(stdout.trim())
  }

  if (stderr.trim()) {
    textSections.push(`stderr:\n${stderr.trim()}`)
  }

  const isError = exitCode !== 0

  return {
    isError,
    content: [
      {
        type: 'text',
        text: textSections.filter(Boolean).join('\n\n'),
      },
    ],
    structuredContent: {
      toolName,
      model: model ?? null,
      cwd,
      command: process.env.CLAUDE_CODE_BIN || 'claude',
      args,
      prompt,
      exitCode,
      assistantText: assistantText || null,
      stderr: stderr.trim() || null,
      stdout: stdout.trim() || null,
      parsedOutput: normalizedParsedOutput,
    },
  }
}

async function runClaudeTask(rawArgs) {
  const prompt = requireString(rawArgs.prompt, 'prompt')
  const profileName = optionalString(rawArgs.profile)
  const progressToken = rawArgs.progressToken
  const agent = optionalString(rawArgs.agent)
  const bridgeOpenCode = ensureBoolean(rawArgs.bridgeOpenCode, 'bridgeOpenCode') ?? true
  const bridgeServerName = optionalString(rawArgs.bridgeServerName)
  const openCodeConfigPath = optionalString(rawArgs.openCodeConfigPath)
  const openCodeSkillsDir = optionalString(rawArgs.openCodeSkillsDir)
  const agents = ensureJsonOrString(rawArgs.agents, 'agents')
  const model = optionalString(rawArgs.model)
  const fallbackModel = optionalString(rawArgs.fallbackModel)
  const explicitSystemPrompt = optionalString(rawArgs.systemPrompt)
  const appendSystemPrompt = optionalString(rawArgs.appendSystemPrompt)
  const permissionMode = ensurePermissionMode(rawArgs.permissionMode)
  const dangerouslySkipPermissions = ensureBoolean(
    rawArgs.dangerouslySkipPermissions,
    'dangerouslySkipPermissions'
  )
  const allowDangerouslySkipPermissions = ensureBoolean(
    rawArgs.allowDangerouslySkipPermissions,
    'allowDangerouslySkipPermissions'
  )
  const allowedTools = ensureStringArray(rawArgs.allowedTools, 'allowedTools')
  const disallowedTools = ensureStringArray(rawArgs.disallowedTools, 'disallowedTools')
  const tools = ensureStringArray(rawArgs.tools, 'tools')
  const maxTurns = ensureInteger(rawArgs.maxTurns, 'maxTurns')
  const effort = ensureEnum(rawArgs.effort, 'effort', EFFORT_LEVELS)
  const settings = ensureJsonOrString(rawArgs.settings, 'settings')
  const settingSources = ensureStringArray(rawArgs.settingSources, 'settingSources')
  const explicitOutputFormat = ensureEnum(
    rawArgs.outputFormat,
    'outputFormat',
    OUTPUT_FORMATS
  )
  const inputFormat = ensureEnum(rawArgs.inputFormat, 'inputFormat', INPUT_FORMATS)
  const explicitIncludePartialMessages = ensureBoolean(
    rawArgs.includePartialMessages,
    'includePartialMessages'
  )
  const replayUserMessages = ensureBoolean(
    rawArgs.replayUserMessages,
    'replayUserMessages'
  )
  const jsonSchema = ensureJsonOrString(rawArgs.jsonSchema, 'jsonSchema')
  const maxBudgetUsd = ensureNumber(rawArgs.maxBudgetUsd, 'maxBudgetUsd')
  const continueMostRecent = ensureBoolean(
    rawArgs.continueMostRecent,
    'continueMostRecent'
  )
  const resumeSession = optionalString(rawArgs.resumeSession)
  const sessionId = optionalString(rawArgs.sessionId)
  const forkSession = ensureBoolean(rawArgs.forkSession, 'forkSession')
  const noSessionPersistence = ensureBoolean(
    rawArgs.noSessionPersistence,
    'noSessionPersistence'
  )
  const disableSlashCommands = ensureBoolean(
    rawArgs.disableSlashCommands,
    'disableSlashCommands'
  )
  const mcpConfig = ensureStringArray(rawArgs.mcpConfig, 'mcpConfig')
  const strictMcpConfig = ensureBoolean(rawArgs.strictMcpConfig, 'strictMcpConfig')
  const debugFilter = optionalString(rawArgs.debugFilter)
  const debugFile = optionalString(rawArgs.debugFile)
  const verbose = ensureBoolean(rawArgs.verbose, 'verbose')
  const betas = ensureStringArray(rawArgs.betas, 'betas')
  const timeoutMs = ensureInteger(rawArgs.timeoutMs, 'timeoutMs') ?? DEFAULT_TIMEOUT_MS
  const outputFormat = explicitOutputFormat
    ?? (rawArgs.toolName ? 'stream-json' : undefined)
  const includePartialMessages = explicitIncludePartialMessages
    ?? (outputFormat === 'stream-json' ? true : undefined)
  const baseDirectory = process.cwd()
  const cwd = rawArgs.cwd
    ? await resolveDirectory(rawArgs.cwd, baseDirectory, 'cwd')
    : baseDirectory
  const addDirs = await Promise.all(
    ensureStringArray(rawArgs.addDirs, 'addDirs').map((directory) =>
      resolveDirectory(directory, cwd, 'addDirs')
    )
  )
  const pluginDirs = await Promise.all(
    ensureStringArray(rawArgs.pluginDirs, 'pluginDirs').map((directory) =>
      resolveDirectory(directory, cwd, 'pluginDirs')
    )
  )
  const profile = resolveProfile(profileName)
  const systemPrompt = explicitSystemPrompt ?? profile?.systemPrompt
  const bridge = bridgeOpenCode
    ? await loadOpenCodeBridge({
        bridgeServerName,
        openCodeConfigPath,
        openCodeSkillsDir,
      })
    : null
  const effectiveMcpConfig = bridge
    ? [...mcpConfig, buildBridgeMcpConfig(bridge)]
    : mcpConfig

  const args = buildClaudeArgs({
    prompt,
    agent,
    agents,
    model,
    addDirs,
    systemPrompt,
    appendSystemPrompt,
    permissionMode,
    dangerouslySkipPermissions,
    allowDangerouslySkipPermissions,
    allowedTools,
    disallowedTools,
    tools,
    maxTurns,
    fallbackModel,
    effort,
    pluginDirs,
    settings,
    settingSources,
    outputFormat,
    inputFormat,
    includePartialMessages,
    replayUserMessages,
    jsonSchema,
    maxBudgetUsd,
    continueMostRecent,
    resumeSession,
    sessionId,
    forkSession,
    noSessionPersistence,
    disableSlashCommands,
    mcpConfig: effectiveMcpConfig,
    strictMcpConfig,
    debugFilter,
    debugFile,
    verbose,
    betas,
  })

  const result = await runClaudeProcess({
    args,
    cwd,
    timeoutMs,
    outputFormat,
    progressToken,
  })

  return formatToolResult({
    toolName: rawArgs.toolName,
    prompt,
    cwd,
    model,
    args,
    ...result,
  })
}

function runClaudeProcess({ args, cwd, timeoutMs, outputFormat, progressToken }) {
  const command = process.env.CLAUDE_CODE_BIN || 'claude'

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let timedOut = false
    let streamBuffer = ''
    let progressCount = 0
    let lastProgressMessage = ''

    const emitProgress = (message) => {
      const normalizedMessage = clipText(message)
      if (!normalizedMessage || normalizedMessage === lastProgressMessage) {
        return
      }

      progressCount += 1
      lastProgressMessage = normalizedMessage
      sendProgress(progressToken, progressCount, normalizedMessage)
    }

    const timeoutHandle = setTimeout(() => {
      timedOut = true
      emitProgress(`Claude Code timed out after ${timeoutMs}ms`)
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 2000).unref()
    }, timeoutMs)

    emitProgress('Starting Claude Code')

    const flushStreamBuffer = (force = false) => {
      if (outputFormat !== 'stream-json') {
        return
      }

      const lines = streamBuffer.split('\n')
      if (!force) {
        streamBuffer = lines.pop() ?? ''
      } else {
        streamBuffer = ''
      }

      for (const line of lines) {
        const event = safeJsonParse(line.trim())
        if (!event) {
          continue
        }

        const summary = summarizeClaudeEvent(event)
        if (summary) {
          emitProgress(summary)
        }
      }
    }

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout += text
      streamBuffer += text
      flushStreamBuffer()
    })

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      stderr += text

      const lines = text
        .split('\n')
        .map((line) => clipText(line))
        .filter(Boolean)

      for (const line of lines) {
        emitProgress(`stderr: ${line}`)
      }
    })

    child.on('error', (error) => {
      clearTimeout(timeoutHandle)
      flushStreamBuffer(true)
      emitProgress(error.message)
      resolve({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        parsedOutput: null,
      })
    })

    child.on('close', (exitCode) => {
      clearTimeout(timeoutHandle)
      flushStreamBuffer(true)

      const parsedOutput = safeJsonParse(stdout.trim())
      const timeoutMessage = timedOut
        ? `Claude Code timed out after ${timeoutMs}ms.`
        : ''
      const finalSummary = timedOut
        ? timeoutMessage
        : exitCode === 0
          ? 'Claude Code finished'
          : `Claude Code exited with code ${exitCode ?? 1}`
      emitProgress(finalSummary)

      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr: [stderr.trim(), timeoutMessage].filter(Boolean).join('\n'),
        parsedOutput,
      })
    })
  })
}

function sendMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function sendResponse(id, result) {
  sendMessage({
    jsonrpc: JSON_RPC_VERSION,
    id,
    result,
  })
}

function sendError(id, code, message, data) {
  sendMessage({
    jsonrpc: JSON_RPC_VERSION,
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  })
}

function sendProgress(progressToken, progress, message) {
  if (progressToken === undefined || progressToken === null) {
    return
  }

  sendMessage({
    jsonrpc: JSON_RPC_VERSION,
    method: 'notifications/progress',
    params: {
      progressToken,
      progress,
      ...(message ? { message } : {}),
    },
  })
}

function isPromptsOnlyMode() {
  return process.env.OPENCODE_BRIDGE_MODE === 'prompts-only'
}

async function handleRequest(message) {
  const { id, method, params = {} } = message

  if (id === undefined) {
    return
  }

  try {
    switch (method) {
      case 'initialize':
        sendResponse(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            tools: {
              listChanged: false,
            },
            prompts: {
              listChanged: false,
            },
          },
          serverInfo: SERVER_INFO,
        })
        return

      case 'ping':
        sendResponse(id, {})
        return

      case 'tools/list':
        sendResponse(id, {
          tools: isPromptsOnlyMode() ? [] : TOOL_DEFINITIONS,
        })
        return

      case 'tools/call': {
        if (isPromptsOnlyMode()) {
          sendError(id, -32601, 'Tools are disabled in prompts-only bridge mode')
          return
        }

        const toolName = requireString(params.name, 'name')
        const handler = toolHandlers[toolName]
        const progressToken = params?._meta?.progressToken

        if (!handler) {
          sendError(id, -32602, `Unknown tool: ${toolName}`)
          return
        }

        const result = await handler({
          ...(params.arguments ?? {}),
          _meta: params._meta,
          progressToken,
        })
        sendResponse(id, result)
        return
      }

      case 'prompts/list':
        sendResponse(id, {
          prompts: await listBridgePromptDefinitions(),
        })
        return

      case 'prompts/get':
        sendResponse(id, await getBridgePromptResponse(params))
        return

      default:
        sendError(id, -32601, `Method not found: ${method}`)
    }
  } catch (error) {
    sendError(
      id,
      -32603,
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}

function handleNotification(message) {
  if (message.method === 'notifications/initialized') {
    return
  }
}

let buffer = ''
let pendingRequests = 0
let inputEnded = false

function maybeExit() {
  if (inputEnded && pendingRequests === 0) {
    process.exit(0)
  }
}

process.stdin.setEncoding('utf8')
process.stdin.on('data', async (chunk) => {
  buffer += chunk
  const messages = buffer.split('\n')
  buffer = messages.pop() ?? ''

  for (const line of messages) {
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      continue
    }

    let message

    try {
      message = JSON.parse(trimmedLine)
    } catch {
      process.stderr.write(`Invalid JSON-RPC message: ${trimmedLine}\n`)
      continue
    }

    if (message.id === undefined) {
      handleNotification(message)
      continue
    }

    pendingRequests += 1

    handleRequest(message)
      .catch((error) => {
        process.stderr.write(`Request handling failed: ${error.message}\n`)
      })
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
