/**
 * Tool Output Truncator Hook
 * Truncates large tool outputs to save context window
 */

const DEFAULT_MAX_TOKENS = 50_000 // ~200k chars
const WEBFETCH_MAX_TOKENS = 10_000 // ~40k chars
const CHARS_PER_TOKEN_ESTIMATE = 4

const TRUNCATABLE_TOOLS = [
  "grep", "Grep", "safe_grep",
  "glob", "Glob", "safe_glob",
  "lsp_diagnostics",
  "ast_grep_search",
  "interactive_bash", "Interactive_bash",
  "skill_mcp",
  "webfetch", "WebFetch",
]

const TOOL_SPECIFIC_MAX_TOKENS = {
  webfetch: WEBFETCH_MAX_TOKENS,
  WebFetch: WEBFETCH_MAX_TOKENS,
}

function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE)
}

function truncateToTokenLimit(output, maxTokens, preserveHeaderLines = 3) {
  if (typeof output !== 'string') {
    return { result: String(output ?? ''), truncated: false }
  }

  const currentTokens = estimateTokens(output)
  if (currentTokens <= maxTokens) {
    return { result: output, truncated: false }
  }

  const lines = output.split("\n")

  if (lines.length <= preserveHeaderLines) {
    const maxChars = maxTokens * CHARS_PER_TOKEN_ESTIMATE
    return {
      result: output.slice(0, maxChars) + "\n\n[Output truncated due to context window limit]",
      truncated: true,
    }
  }

  const headerLines = lines.slice(0, preserveHeaderLines)
  const contentLines = lines.slice(preserveHeaderLines)

  const headerText = headerLines.join("\n")
  const headerTokens = estimateTokens(headerText)
  const truncationMessageTokens = 50
  const availableTokens = maxTokens - headerTokens - truncationMessageTokens

  if (availableTokens <= 0) {
    return {
      result: headerText + "\n\n[Content truncated due to context window limit]",
      truncated: true,
      removedCount: contentLines.length,
    }
  }

  const resultLines = []
  let currentTokenCount = 0

  for (const line of contentLines) {
    const lineTokens = estimateTokens(line + "\n")
    if (currentTokenCount + lineTokens > availableTokens) break
    resultLines.push(line)
    currentTokenCount += lineTokens
  }

  const truncatedContent = [...headerLines, ...resultLines].join("\n")
  const removedCount = contentLines.length - resultLines.length

  return {
    result: truncatedContent + `\n\n[${removedCount} more lines truncated due to context window limit]`,
    truncated: true,
    removedCount,
  }
}

export function createToolOutputTruncatorHook(ctx, options = {}) {
  const truncateAll = options.truncateAll ?? false

  const toolExecuteAfter = async (input, output) => {
    if (!truncateAll && !TRUNCATABLE_TOOLS.includes(input.tool)) return
    if (typeof output.output !== 'string') return

    try {
      const targetMaxTokens = TOOL_SPECIFIC_MAX_TOKENS[input.tool] ?? DEFAULT_MAX_TOKENS
      const { result, truncated } = truncateToTokenLimit(output.output, targetMaxTokens)
      if (truncated) {
        output.output = result
      }
    } catch {
      // Graceful degradation
    }
  }

  return {
    "tool.execute.after": toolExecuteAfter,
  }
}

export default createToolOutputTruncatorHook
