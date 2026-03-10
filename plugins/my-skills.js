/**
 * My Skills Plugin for OpenCode
 *
 * Provides the `skill` tool that loads SKILL.md files from skills/my-skills/.
 * Also provides worker_plan_task and worker_execute_task to run the chosen
 * worker CLI (claude or agent) in plan-only or execute mode.
 *
 * Usage (in prompts/commands):
 *   Invoke the my-skills:brainstorming skill
 *   Load the skill-chooser skill from my-skills
 *   worker_plan_task / worker_execute_task after worker-selection
 */

import { tool } from '@opencode-ai/plugin'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Default timeout for worker CLI runs (10 minutes)
const WORKER_TIMEOUT_MS = 600_000

const CLAUDE_BIN = process.env.CLAUDE_CODE_BIN ?? 'claude'
const AGENT_BIN = process.env.CURSOR_AGENT_BIN ?? 'agent'

// Skills root: plugins/ is one level inside the config dir
const SKILLS_ROOT = join(__dirname, '..', 'skills')

// Collections to search, in priority order
const COLLECTIONS = ['my-skills', 'update-config']

/**
 * Resolve a skill name to its SKILL.md path.
 * Accepts these formats:
 *   - "brainstorming"           → searches all collections (subdir pattern)
 *   - "my-skills:brainstorming" → searches my-skills/<name>/SKILL.md
 *   - "update-config"           → searches update-config/SKILL.md (flat pattern)
 *
 * @param {string} name
 * @returns {{ path: string, collection: string, skillName: string } | null}
 */
const resolveSkill = (name) => {
  let collection = null
  let skillName = name

  if (name.includes(':')) {
    const parts = name.split(':')
    collection = parts[0]
    skillName = parts[1]
  }

  const collectionsToSearch = collection ? [collection] : COLLECTIONS

  for (const col of collectionsToSearch) {
    // Pattern 1: skills/<collection>/<skill-name>/SKILL.md (my-skills style)
    const subdirPath = join(SKILLS_ROOT, col, skillName, 'SKILL.md')
    if (existsSync(subdirPath)) {
      return { path: subdirPath, collection: col, skillName }
    }

    // Pattern 2: skills/<collection>/SKILL.md (flat style — e.g. update-config)
    if (col === skillName || skillName === col) {
      const flatPath = join(SKILLS_ROOT, col, 'SKILL.md')
      if (existsSync(flatPath)) {
        return { path: flatPath, collection: col, skillName: col }
      }
    }
  }

  // Fallback: if skillName matches a collection name exactly, load flat SKILL.md
  const flatPath = join(SKILLS_ROOT, skillName, 'SKILL.md')
  if (existsSync(flatPath)) {
    return { path: flatPath, collection: skillName, skillName }
  }

  return null
}

/**
 * List all available skills across all collections.
 * @returns {Array<{ collection: string, name: string }>}
 */
const listSkills = () => {
  const skills = []

  for (const col of COLLECTIONS) {
    const colPath = join(SKILLS_ROOT, col)
    if (!existsSync(colPath)) continue

    try {
      // Flat pattern: collection itself is a skill (e.g. update-config/SKILL.md)
      const flatSkillMd = join(colPath, 'SKILL.md')
      if (existsSync(flatSkillMd)) {
        skills.push({ collection: col, name: col })
        continue
      }

      // Subdir pattern: each subdirectory is a skill
      const entries = readdirSync(colPath, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const skillMd = join(colPath, entry.name, 'SKILL.md')
        if (existsSync(skillMd)) {
          skills.push({ collection: col, name: entry.name })
        }
      }
    } catch { }
  }

  return skills
}

/**
 * Run worker CLI (claude or agent) and return a structured result.
 * Policy: prefer "agent" for all task sizes; use "claude" only when task is
 * complex and requires brainstorming. Call after worker-selection.
 *
 * @param {'claude'|'agent'} worker
 * @param {string} prompt - Full prompt text for the CLI
 * @param {string} workspaceAbs - Absolute path to project root
 * @param {object} opts - { mode: 'plan'|'execute', model?, profile? (claude only) }
 * @returns {{ success: boolean, stdout?: string, stderr?: string, exitCode?: number, error?: string }}
 */
const runWorker = (worker, prompt, workspaceAbs, opts = {}) => {
  const { mode = 'plan', model, profile } = opts
  const result = { success: false, stdout: '', stderr: '', exitCode: -1 }

  if (worker === 'agent') {
    const args = [
      '-p', prompt,
      '--trust', '--approve-mcps',
      '--mode', mode === 'plan' ? 'plan' : 'agent',
      '--workspace', workspaceAbs
    ]
    if (mode === 'execute') args.push('--force')
    if (model) args.push('--model', model)
    const out = spawnSync(AGENT_BIN, args, {
      encoding: 'utf-8',
      timeout: WORKER_TIMEOUT_MS,
      maxBuffer: 50 * 1024 * 1024
    })
    result.stdout = out.stdout ?? ''
    result.stderr = out.stderr ?? ''
    result.exitCode = out.status ?? (out.signal ? -1 : 0)
    result.success = result.exitCode === 0
    if (out.error) result.error = out.error.message
    else if (!result.success && result.stderr) result.error = result.stderr.slice(0, 500)
    else if (!result.success) result.error = `Worker exited with code ${result.exitCode}`
    return result
  }

  if (worker === 'claude') {
    const args = [
      '-p', prompt,
      '--output-format', 'json',
      '--permission-mode', mode === 'plan' ? 'plan' : 'acceptEdits'
    ]
    if (model) args.push('--model', model)
    if (profile) args.push('--append-system-prompt', `Profile: ${profile}.`)
    const out = spawnSync(CLAUDE_BIN, args, {
      encoding: 'utf-8',
      cwd: workspaceAbs,
      timeout: WORKER_TIMEOUT_MS,
      maxBuffer: 50 * 1024 * 1024
    })
    result.stdout = out.stdout ?? ''
    result.stderr = out.stderr ?? ''
    result.exitCode = out.status ?? (out.signal ? -1 : 0)
    result.success = result.exitCode === 0
    if (out.error) result.error = out.error.message
    else if (!result.success && result.stderr) result.error = result.stderr.slice(0, 500)
    else if (!result.success) result.error = `Worker exited with code ${result.exitCode}`
    return result
  }

  result.error = `Unknown worker: ${worker}. Use "agent" or "claude".`
  return result
}

export const MySkillsPlugin = async (_ctx) => {
  return {
    tool: {
      skill: tool({
        description:
          'Load a skill by name to get detailed instructions and workflows. ' +
          'Skills are stored in skills/my-skills/ as SKILL.md files. ' +
          'Use format "skill-name" or "collection:skill-name". ' +
          'Use name="list" to see all available skills.',

        args: {
          name: tool.schema
            .string()
            .describe(
              'Skill name to load (e.g. "brainstorming", "my-skills:systematic-debugging"). ' +
              'Pass "list" to list all available skills.'
            ),
        },

        async execute({ name }) {
          // Special case: list all skills
          if (name === 'list') {
            const skills = listSkills()
            if (skills.length === 0) {
              return 'No skills found. Check that skills/my-skills/ directory exists.'
            }
            const lines = skills.map(s => `- ${s.collection}:${s.name}`)
            return `Available skills (${skills.length}):\n${lines.join('\n')}`
          }

          const resolved = resolveSkill(name)

          if (!resolved) {
            // Provide helpful error with available skills
            const available = listSkills()
            const suggestions = available
              .filter(s => s.name.includes(name) || name.includes(s.name))
              .map(s => `  ${s.collection}:${s.name}`)

            let msg = `Skill "${name}" not found.\n`
            if (suggestions.length > 0) {
              msg += `Did you mean:\n${suggestions.join('\n')}\n`
            }
            msg += `\nUse skill("list") to see all ${available.length} available skills.`
            return msg
          }

          try {
            const content = readFileSync(resolved.path, 'utf-8')
            return [
              `<skill_content name="${resolved.collection}:${resolved.skillName}">`,
              content,
              `</skill_content>`,
            ].join('\n')
          } catch (err) {
            return `Error reading skill "${name}": ${err?.message ?? String(err)}`
          }
        },
      }),

      worker_plan_task: tool({
        description:
          'Run the selected worker CLI (claude or agent) in plan-only mode. Call after worker-selection (my-skills:worker-selection). ' +
          'Prefer worker="agent" for all task sizes; use worker="claude" only when the task is complex and requires brainstorming. ' +
          'Returns a JSON object with success, stdout, stderr, exitCode, and error (on failure).',

        args: {
          worker: tool.schema
            .enum(['claude', 'agent'])
            .describe('Which worker CLI to use. Prefer "agent" for all tasks; use "claude" only when complex and brainstorming is required.'),
          task: tool.schema.string().describe('The task description to plan (e.g. "Add API endpoint for user preferences").'),
          workspace: tool.schema
            .string()
            .optional()
            .describe('Project root path. If omitted, the session project directory is used.'),
          context: tool.schema.string().optional().describe('Optional extra context for the plan.'),
          model: tool.schema.string().optional().describe('Model override (e.g. sonnet, opus for claude; gpt-5.2 for agent).'),
          profile: tool.schema
            .string()
            .optional()
            .describe('Claude-only: profile name (e.g. planner, architect). Ignored when worker is agent.')
        },

        async execute(args, context) {
          const workspaceAbs = resolve(args.workspace ?? context.directory ?? process.cwd())
          const prompt = [
            'Create a concrete implementation plan for the task below.',
            'Return a concise numbered plan with assumptions, risks, and verification steps.',
            '',
            'Task: ' + args.task,
            args.context ? 'Context: ' + args.context : ''
          ].filter(Boolean).join('\n')

          const result = runWorker(args.worker, prompt, workspaceAbs, {
            mode: 'plan',
            model: args.model,
            profile: args.profile
          })
          return JSON.stringify(result)
        }
      }),

      worker_execute_task: tool({
        description:
          'Run the selected worker CLI (claude or agent) in execute mode (apply edits). Call after worker-selection (my-skills:worker-selection). ' +
          'Prefer worker="agent" for all task sizes; use worker="claude" only when the task is complex and requires brainstorming. ' +
          'Returns a JSON object with success, stdout, stderr, exitCode, and error (on failure).',

        args: {
          worker: tool.schema
            .enum(['claude', 'agent'])
            .describe('Which worker CLI to use. Prefer "agent" for all tasks; use "claude" only when complex and brainstorming is required.'),
          task: tool.schema.string().describe('The task to execute.'),
          workspace: tool.schema
            .string()
            .optional()
            .describe('Project root path. If omitted, the session project directory is used.'),
          plan: tool.schema.string().optional().describe('Optional plan from a previous worker_plan_task (or context).'),
          context: tool.schema.string().optional().describe('Optional extra context.'),
          model: tool.schema.string().optional().describe('Model override.'),
          profile: tool.schema
            .string()
            .optional()
            .describe('Claude-only profile. Ignored when worker is agent.')
        },

        async execute(args, context) {
          const workspaceAbs = resolve(args.workspace ?? context.directory ?? process.cwd())
          const prompt = [
            'Execute the task below using the worker.',
            'Prefer small, verifiable changes and summarize what you changed.',
            '',
            'Task: ' + args.task,
            args.plan ? 'Plan: ' + args.plan : '',
            args.context ? 'Context: ' + args.context : ''
          ].filter(Boolean).join('\n')

          const result = runWorker(args.worker, prompt, workspaceAbs, {
            mode: 'execute',
            model: args.model,
            profile: args.profile
          })
          return JSON.stringify(result)
        }
      })
    },
  }
}

export default MySkillsPlugin
