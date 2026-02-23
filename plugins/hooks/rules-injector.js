/**
 * Rules Injector Hook
 * Injects project rules from .claude/rules, .cursor/rules, .github/copilot-instructions.md
 */

import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs"
import { join, relative, resolve, dirname } from "node:path"
import { homedir } from "node:os"
import { createHash } from "crypto"

const PROJECT_MARKERS = [".git", "pyproject.toml", "package.json", "Cargo.toml", "go.mod", ".venv"]
const PROJECT_RULE_SUBDIRS = [
  [".github", "instructions"],
  [".cursor", "rules"],
  [".claude", "rules"],
  [".sisyphus", "rules"],
]
const PROJECT_RULE_FILES = [".github/copilot-instructions.md"]
const USER_RULE_DIR = ".claude/rules"
const RULE_EXTENSIONS = [".md", ".mdc"]

// Storage path for session cache
const OPENCODE_STORAGE = join(homedir(), ".local", "share", "opencode")
const RULES_INJECTOR_STORAGE = join(OPENCODE_STORAGE, "rules-injector")

function ensureStorageDir() {
  if (!existsSync(RULES_INJECTOR_STORAGE)) {
    mkdirSync(RULES_INJECTOR_STORAGE, { recursive: true })
  }
}

function getStoragePath(sessionID) {
  return join(RULES_INJECTOR_STORAGE, `${sessionID}.json`)
}

function loadInjectedRules(sessionID) {
  const filePath = getStoragePath(sessionID)
  if (!existsSync(filePath)) {
    return { contentHashes: new Set(), realPaths: new Set() }
  }
  try {
    const content = readFileSync(filePath, "utf-8")
    const data = JSON.parse(content)
    return {
      contentHashes: new Set(data.injectedHashes || []),
      realPaths: new Set(data.injectedRealPaths || []),
    }
  } catch {
    return { contentHashes: new Set(), realPaths: new Set() }
  }
}

function saveInjectedRules(sessionID, data) {
  ensureStorageDir()
  const storageData = {
    sessionID,
    injectedHashes: [...data.contentHashes],
    injectedRealPaths: [...data.realPaths],
    updatedAt: Date.now(),
  }
  writeFileSync(getStoragePath(sessionID), JSON.stringify(storageData, null, 2))
}

function clearInjectedRules(sessionID) {
  const filePath = getStoragePath(sessionID)
  if (existsSync(filePath)) {
    unlinkSync(filePath)
  }
}

function findProjectRoot(filePath) {
  let dir = dirname(filePath)
  while (dir !== "/" && dir !== ".") {
    for (const marker of PROJECT_MARKERS) {
      if (existsSync(join(dir, marker))) {
        return dir
      }
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

function parseRuleFrontmatter(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { metadata: {}, body: content }
  }

  const yamlContent = match[1]
  const body = match[2]
  const metadata = {}

  // Simple YAML parsing
  for (const line of yamlContent.split("\n")) {
    const colonIndex = line.indexOf(":")
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, "")
      if (key === "alwaysApply") {
        metadata.alwaysApply = value === "true"
      } else if (key === "globs" || key === "paths") {
        metadata.globs = value.includes(",") 
          ? value.split(",").map(s => s.trim())
          : value
      }
    }
  }

  return { metadata, body }
}

function createContentHash(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 16)
}

function globMatch(pattern, filePath) {
  // Simple glob matching
  const regex = new RegExp(
    "^" + pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "[^/]")
      .replace(/\./g, "\\.")
    + "$"
  )
  return regex.test(filePath)
}

function shouldApplyRule(metadata, currentFilePath, projectRoot) {
  if (metadata.alwaysApply === true) {
    return { applies: true, reason: "alwaysApply" }
  }

  const globs = metadata.globs
  if (!globs) {
    return { applies: false }
  }

  const patterns = Array.isArray(globs) ? globs : [globs]
  const relativePath = projectRoot ? relative(projectRoot, currentFilePath) : currentFilePath

  for (const pattern of patterns) {
    if (globMatch(pattern, relativePath)) {
      return { applies: true, reason: `glob: ${pattern}` }
    }
  }

  return { applies: false }
}

function findRuleFiles(projectRoot, home, targetFile) {
  const candidates = []

  if (!projectRoot) return candidates

  // Check project-level rule files
  for (const ruleFile of PROJECT_RULE_FILES) {
    const rulePath = join(projectRoot, ruleFile)
    if (existsSync(rulePath)) {
      candidates.push({
        path: rulePath,
        realPath: rulePath,
        isGlobal: false,
        distance: 0,
        isSingleFile: true,
      })
    }
  }

  // Check project-level rule directories
  for (const [subdir, rulesDir] of PROJECT_RULE_SUBDIRS) {
    const rulesPath = join(projectRoot, subdir, rulesDir)
    if (existsSync(rulesPath)) {
      try {
        const files = require("fs").readdirSync(rulesPath)
        for (const file of files) {
          if (RULE_EXTENSIONS.some(ext => file.endsWith(ext))) {
            const rulePath = join(rulesPath, file)
            candidates.push({
              path: rulePath,
              realPath: rulePath,
              isGlobal: false,
              distance: 0,
            })
          }
        }
      } catch {}
    }
  }

  // Check user-level rules
  const userRulesPath = join(home, USER_RULE_DIR)
  if (existsSync(userRulesPath)) {
    try {
      const files = require("fs").readdirSync(userRulesPath)
      for (const file of files) {
        if (RULE_EXTENSIONS.some(ext => file.endsWith(ext))) {
          const rulePath = join(userRulesPath, file)
          candidates.push({
            path: rulePath,
            realPath: rulePath,
            isGlobal: true,
            distance: 999,
          })
        }
      }
    } catch {}
  }

  return candidates
}

function getRuleInjectionFilePath(output) {
  const metadata = output.metadata
  const metadataFilePath = metadata && typeof metadata === "object" ? metadata.filePath : undefined

  if (typeof metadataFilePath === "string" && metadataFilePath.length > 0) {
    return metadataFilePath
  }

  if (typeof output.title === "string" && output.title.length > 0) {
    return output.title
  }

  return null
}

// Session cache store
const sessionCaches = new Map()

function getSessionCache(sessionID) {
  if (!sessionCaches.has(sessionID)) {
    sessionCaches.set(sessionID, loadInjectedRules(sessionID))
  }
  return sessionCaches.get(sessionID)
}

function clearSessionCache(sessionID) {
  sessionCaches.delete(sessionID)
  clearInjectedRules(sessionID)
}

export function createRulesInjectorHook(ctx) {
  const TRACKED_TOOLS = ["read", "write", "edit", "multiedit"]

  const toolExecuteAfter = async (input, output) => {
    const toolName = input.tool.toLowerCase()

    if (!TRACKED_TOOLS.includes(toolName)) return

    const filePath = getRuleInjectionFilePath(output)
    if (!filePath) return

    const resolved = filePath.startsWith("/") ? filePath : resolve(ctx.directory, filePath)
    const projectRoot = findProjectRoot(resolved)
    const cache = getSessionCache(input.sessionID)
    const home = homedir()

    const ruleFileCandidates = findRuleFiles(projectRoot, home, resolved)
    const toInject = []
    let dirty = false

    for (const candidate of ruleFileCandidates) {
      if (cache.realPaths.has(candidate.realPath)) continue

      try {
        const rawContent = readFileSync(candidate.path, "utf-8")
        const { metadata, body } = parseRuleFrontmatter(rawContent)

        let matchReason
        if (candidate.isSingleFile) {
          matchReason = "copilot-instructions (always apply)"
        } else {
          const matchResult = shouldApplyRule(metadata, resolved, projectRoot)
          if (!matchResult.applies) continue
          matchReason = matchResult.reason ?? "matched"
        }

        const contentHash = createContentHash(body)
        if (cache.contentHashes.has(contentHash)) continue

        const relativePath = projectRoot
          ? relative(projectRoot, candidate.path)
          : candidate.path

        toInject.push({
          relativePath,
          matchReason,
          content: body,
          distance: candidate.distance,
        })

        cache.realPaths.add(candidate.realPath)
        cache.contentHashes.add(contentHash)
        dirty = true
      } catch {}
    }

    if (toInject.length === 0) return

    toInject.sort((a, b) => a.distance - b.distance)

    for (const rule of toInject) {
      output.output += `\n\n[Rule: ${rule.relativePath}]\n[Match: ${rule.matchReason}]\n${rule.content}`
    }

    if (dirty) {
      saveInjectedRules(input.sessionID, cache)
    }
  }

  const eventHandler = async ({ event }) => {
    if (event.type === "session.deleted") {
      const sessionID = event.properties?.info?.id
      if (sessionID) {
        clearSessionCache(sessionID)
      }
    }

    if (event.type === "session.compacted") {
      const sessionID = event.properties?.sessionID ?? event.properties?.info?.id
      if (sessionID) {
        clearSessionCache(sessionID)
      }
    }
  }

  return {
    "tool.execute.after": toolExecuteAfter,
    event: eventHandler,
  }
}

export default createRulesInjectorHook
