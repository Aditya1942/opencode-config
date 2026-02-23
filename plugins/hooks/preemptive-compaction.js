/**
 * Preemptive Compaction Hook
 * Auto-compacts context when it reaches 78% of the limit
 */

const DEFAULT_ANTHROPIC_ACTUAL_LIMIT = 200_000
const PREEMPTIVE_COMPACTION_THRESHOLD = 0.78

function getAnthropicActualLimit() {
  return process.env.ANTHROPIC_1M_CONTEXT === "true" ||
    process.env.VERTEX_ANTHROPIC_1M_CONTEXT === "true"
    ? 1_000_000
    : DEFAULT_ANTHROPIC_ACTUAL_LIMIT
}

function isAnthropicProvider(providerID) {
  return providerID === "anthropic" || providerID === "google-vertex-anthropic"
}

export function createPreemptiveCompactionHook(ctx) {
  const compactionInProgress = new Set()
  const compactedSessions = new Set()
  const tokenCache = new Map()

  const toolExecuteAfter = async (input, output) => {
    const { sessionID } = input

    if (compactedSessions.has(sessionID) || compactionInProgress.has(sessionID)) return

    const cached = tokenCache.get(sessionID)
    if (!cached) return

    const actualLimit = isAnthropicProvider(cached.providerID)
      ? getAnthropicActualLimit()
      : DEFAULT_ANTHROPIC_ACTUAL_LIMIT

    const lastTokens = cached.tokens
    const totalInputTokens = (lastTokens?.input ?? 0) + (lastTokens?.cache?.read ?? 0)
    const usageRatio = totalInputTokens / actualLimit

    if (usageRatio < PREEMPTIVE_COMPACTION_THRESHOLD) return

    const modelID = cached.modelID
    if (!modelID) return

    compactionInProgress.add(sessionID)

    try {
      // Show toast before compacting
      try {
        await ctx.client.tui.showToast({
          body: {
            title: "Preemptive Compaction",
            message: `Context at ${(usageRatio * 100).toFixed(0)}% - auto-compacting...`,
            variant: "warning",
            duration: 3000,
          },
        })
      } catch {}

      // Trigger compaction
      await ctx.client.session.summarize({
        path: { id: sessionID },
        body: { providerID: cached.providerID, modelID: modelID, auto: true },
        query: { directory: ctx.directory },
      })

      compactedSessions.add(sessionID)
    } catch (error) {
      console.error("[preemptive-compaction] Compaction failed:", error)
    } finally {
      compactionInProgress.delete(sessionID)
    }
  }

  const eventHandler = async ({ event }) => {
    const props = event.properties || {}

    if (event.type === "session.deleted") {
      const sessionID = props.info?.id
      if (sessionID) {
        compactionInProgress.delete(sessionID)
        compactedSessions.delete(sessionID)
        tokenCache.delete(sessionID)
      }
      return
    }

    if (event.type === "message.updated") {
      const info = props.info
      if (!info || info.role !== "assistant" || !info.finish) return
      if (!info.sessionID || !info.providerID || !info.tokens) return

      tokenCache.set(info.sessionID, {
        providerID: info.providerID,
        modelID: info.modelID ?? "",
        tokens: info.tokens,
      })
    }
  }

  return {
    "tool.execute.after": toolExecuteAfter,
    event: eventHandler,
  }
}

export default createPreemptiveCompactionHook
