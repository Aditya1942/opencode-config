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
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

    },
  }
}

export default MySkillsPlugin
