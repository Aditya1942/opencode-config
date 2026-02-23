/**
 * Model Fallback Hook
 * Falls back to alternative models when API errors occur
 */

// Default fallback chains for common providers
const DEFAULT_FALLBACK_CHAINS = {
  anthropic: [
    { providers: ["anthropic"], model: "claude-sonnet-4-6" },
    { providers: ["anthropic"], model: "claude-haiku-4-5" },
  ],
  openai: [
    { providers: ["openai"], model: "gpt-4.1" },
    { providers: ["openai"], model: "gpt-4.1-mini" },
  ],
  google: [
    { providers: ["google"], model: "gemini-2.5-pro" },
    { providers: ["google"], model: "gemini-2.5-flash" },
  ],
  opencode: [
    { providers: ["opencode"], model: "claude-sonnet-4-6" },
    { providers: ["opencode"], model: "claude-haiku-4-5" },
    { providers: ["opencode"], model: "gpt-5-nano" },
  ],
}

const pendingModelFallbacks = new Map()

function getFallbackChain(providerID) {
  return DEFAULT_FALLBACK_CHAINS[providerID] || DEFAULT_FALLBACK_CHAINS.opencode
}

export function setPendingModelFallback(sessionID, currentProviderID, currentModelID) {
  const fallbackChain = getFallbackChain(currentProviderID)
  
  if (!fallbackChain || fallbackChain.length === 0) {
    return false
  }

  const existing = pendingModelFallbacks.get(sessionID)

  if (existing) {
    existing.providerID = currentProviderID
    existing.modelID = currentModelID
    existing.pending = true
    if (existing.attemptCount >= existing.fallbackChain.length) {
      return false
    }
    return true
  }

  pendingModelFallbacks.set(sessionID, {
    providerID: currentProviderID,
    modelID: currentModelID,
    fallbackChain,
    attemptCount: 0,
    pending: true,
  })

  return true
}

export function getNextFallback(sessionID) {
  const state = pendingModelFallbacks.get(sessionID)
  if (!state || !state.pending) return null

  const { fallbackChain } = state

  while (state.attemptCount < fallbackChain.length) {
    const fallback = fallbackChain[state.attemptCount]
    state.attemptCount++
    state.pending = false

    return {
      providerID: fallback.providers[0],
      modelID: fallback.model,
      variant: fallback.variant,
    }
  }

  pendingModelFallbacks.delete(sessionID)
  return null
}

export function clearPendingModelFallback(sessionID) {
  pendingModelFallbacks.delete(sessionID)
}

export function createModelFallbackHook(ctx) {
  // Track model errors from session.error events
  const eventHandler = async ({ event }) => {
    if (event.type === "session.error") {
      const props = event.properties || {}
      const sessionID = props.sessionID
      const error = props.error || {}

      // Check for model-related errors
      const isModelError = 
        error.name === "ModelError" ||
        error.name === "OverloadedError" ||
        error.name === "RateLimitError" ||
        error.status === 429 ||
        error.status === 503 ||
        (error.message && (
          error.message.includes("overloaded") ||
          error.message.includes("rate limit") ||
          error.message.includes("capacity")
        ))

      if (isModelError && sessionID) {
        const info = props.info || {}
        setPendingModelFallback(sessionID, info.providerID || "opencode", info.modelID || "")
      }
    }

    // Cleanup on session delete
    if (event.type === "session.deleted") {
      const sessionID = event.properties?.info?.id
      if (sessionID) {
        clearPendingModelFallback(sessionID)
      }
    }
  }

  // Apply fallback on next chat.message
  const chatMessageHandler = async (input, output) => {
    const { sessionID } = input
    if (!sessionID) return

    const fallback = getNextFallback(sessionID)
    if (!fallback) return

    output.message["model"] = {
      providerID: fallback.providerID,
      modelID: fallback.modelID,
    }

    if (fallback.variant !== undefined) {
      output.message["variant"] = fallback.variant
    } else {
      delete output.message["variant"]
    }

    // Show toast notification
    try {
      await ctx.client.tui.showToast({
        body: {
          title: "Model Fallback",
          message: `Switched to ${fallback.providerID}/${fallback.modelID}`,
          variant: "warning",
          duration: 5000,
        },
      })
    } catch {
      // Ignore toast errors
    }
  }

  return {
    event: eventHandler,
    "chat.message": chatMessageHandler,
  }
}

export default createModelFallbackHook
