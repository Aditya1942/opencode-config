/**
 * My Skills Plugin for OpenCode
 *
 * Provides the `skill` tool that loads SKILL.md files from skills/my-skills/.
 *
 * Usage (in prompts/commands):
 *   Invoke the my-skills:brainstorming skill
 *   Load the skill-chooser skill from my-skills
 */

import { tool } from '@opencode-ai/plugin'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RUN_CURSOR_AGENT_SCRIPT = join(__dirname, '..', 'scripts', 'run-cursor-agent.js')

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
 * @description When no collection prefix is provided, collections are searched
 * in priority order: `my-skills` is searched first, then `update-config`.
 * The first matching SKILL.md found wins. To target a specific collection,
 * use the "collection:skill-name" prefix format.
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

      cursor_agent: tool({
        description:
          'Run the Cursor CLI agent with a prompt and return only the final success result text. ' +
          'Use for coding tasks best handled by Cursor\'s agent: editing files, running shell commands, exploring a codebase, or making targeted changes in a specific directory. ' +
          'Set mode="agent" (default) to execute edits/commands; mode="plan" for analysis/planning only (no file mutations); mode="ask" for Q&A explanations. ' +
          'Set include_thinking=true to surface agent reasoning — useful when debugging complex tasks or verifying decisions. ' +
          'Always set cwd when the task involves specific project files. ' +
          'On failure returns an explicit error string (never silent failure) so you can diagnose and retry.',

        args: {
          prompt: tool.schema
            .string()
            .describe(
              'The exact prompt to send to the Cursor agent. Be specific: include file paths, expected outcome, and any constraints. ' +
              'Example: "Add a JSDoc comment to the parseConfig function in src/config.js"'
            ),
          cwd: tool.schema
            .string()
            .describe(
              'Working directory for the agent. REQUIRED when the task involves specific project files. ' +
              'Defaults to the opencode config directory if omitted, which is almost never what you want for project tasks.'
            )
            .optional(),
          mode: tool.schema
            .string()
            .describe(
              'Execution mode: "agent" (default) — full access, can edit files and run commands; ' +
              '"plan" — read-only analysis and planning, no file mutations; ' +
              '"ask" — Q&A explanations, read-only.'
            )
            .optional(),
          model: tool.schema
            .string()
            .describe(
              'Model to use. Recommended values: "auto" (Cursor picks best model) or "composer-1.5". ' +
              'Optional; uses the Cursor account default if omitted. ' +
              'NOTE: ignored when include_thinking=true (ACP mode does not support model selection).'
            )
            .optional(),
          workspace: tool.schema
            .string()
            .describe(
              'Workspace root path override for the agent (passed as --workspace to agent CLI). ' +
              'Must be an absolute path. Optional; use when the workspace root differs from cwd. ' +
              'NOTE: ignored when include_thinking=true (ACP mode).'
            )
            .optional(),
          include_thinking: tool.schema
            .boolean()
            .describe(
              'If true, runs in ACP (Agent Client Protocol) mode and captures the agent\'s thinking alongside the result. ' +
              'Output format: "Result:\\n<text>\\n\\nThinking:\\n<chunks>". ' +
              'Slower than default print mode (up to ~80s total: 4 requests × 20s timeout each). ' +
              'Cannot be combined with model or workspace. Use only when reasoning transparency is needed.'
            )
            .optional(),
        },

        async execute({ prompt, cwd, mode, model, workspace, include_thinking }) {
          // Validate mode early to prevent silent fallback to destructive 'agent' mode
          const VALID_MODES = ['agent', 'plan', 'ask']
          if (mode && !VALID_MODES.includes(mode)) {
            return JSON.stringify({ success: false, error: `Invalid mode "${mode}". Valid modes: ${VALID_MODES.join(', ')}` })
          }

          // Validate cwd is absolute if provided
          const { resolve: pathResolve } = await import('node:path')
          const resolvedCwd = cwd ? pathResolve(cwd) : undefined

          const argv = [RUN_CURSOR_AGENT_SCRIPT]
          if (resolvedCwd) argv.push('--cwd', resolvedCwd)
          if (mode)         argv.push('--mode', mode)
          if (model)        argv.push('--model', model)
          if (workspace)    argv.push('--workspace', workspace)
          if (include_thinking) argv.push('--thinking')
          argv.push('--', prompt ?? '')

          // Outer timeout guards against ACP mode worst-case (4 requests × 20s = 80s)
          // plus buffer for startup/shutdown. Prevents indefinite hangs at the plugin level.
          const OUTER_TIMEOUT_MS = 120_000

          return new Promise((resolve) => {
            let done = false

            const outerTimer = setTimeout(() => {
              if (!done) {
                done = true
                try { child.kill() } catch (_) {}
                resolve(JSON.stringify({ success: false, error: `cursor_agent timed out after ${OUTER_TIMEOUT_MS / 1000}s` }))
              }
            }, OUTER_TIMEOUT_MS)

            const child = spawn(process.execPath, argv, {
              cwd: join(__dirname, '..'),
              stdio: ['ignore', 'pipe', 'pipe'],
            })
            let stdout = ''
            let stderr = ''
            child.stdout.setEncoding('utf8')
            child.stderr.setEncoding('utf8')
            child.stdout.on('data', (chunk) => { stdout += chunk })
            child.stderr.on('data', (chunk) => { stderr += chunk })
            child.on('close', (code) => {
              clearTimeout(outerTimer)
              if (done) return
              done = true
              try {
                const lastLine = stdout.trim().split('\n').pop()
                if (!lastLine) {
                  resolve(JSON.stringify({ success: false, error: stderr.trim() || `Exit code ${code}` }))
                  return
                }
                const parsed = JSON.parse(lastLine)
                if (parsed.success && parsed.result != null) {
                  const out = parsed.thinking?.length
                    ? `Result:\n${parsed.result}\n\nThinking:\n${parsed.thinking.join('\n')}`
                    : parsed.result
                  resolve(out)
                } else {
                  resolve(JSON.stringify({ success: false, error: parsed.error || stderr.trim() || `Exit code ${code}` }))
                }
              } catch (_) {
                resolve(JSON.stringify({ success: false, error: stderr.trim() || stdout || `Exit code ${code}` }))
              }
            })
            child.on('error', (err) => {
              clearTimeout(outerTimer)
              if (!done) {
                done = true
                resolve(JSON.stringify({ success: false, error: `Failed to run script: ${err.message}` }))
              }
            })
          })
        },
      }),
    },
  }
}

export default MySkillsPlugin
