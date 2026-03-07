/**
 * Custom Hooks Plugin for OpenCode
 *
 * Combines standalone implementations of oh-my-opencode hooks:
 * - context-window-monitor: Warns at 70% context usage
 * - tool-output-truncator: Truncates large outputs
 * - model-fallback: Falls back to alternative models
 * - preemptive-compaction: Auto-compacts at 78% usage
 * - rules-injector: Injects project rules
 * - claude-code-usage-tracker: Tracks claude-code MCP invocations for usage/quota
 * - claude-code-quota-gate: Checks quota before claude-code calls; throws to trigger fallback when exhausted
 */

import { createContextWindowMonitorHook } from "./hooks/context-window-monitor.js"
import { createToolOutputTruncatorHook } from "./hooks/tool-output-truncator.js"
import { createModelFallbackHook } from "./hooks/model-fallback.js"
import { createPreemptiveCompactionHook } from "./hooks/preemptive-compaction.js"
import { createRulesInjectorHook } from "./hooks/rules-injector.js"
import { createClaudeCodeUsageTrackerHook } from "./hooks/claude-code-usage-tracker.js"
import { createClaudeCodeQuotaGateHook } from "./hooks/claude-code-quota-gate.js"

export const CustomHooksPlugin = async (ctx) => {
  // Initialize all hooks
  const contextWindowMonitor = createContextWindowMonitorHook(ctx)
  const toolOutputTruncator = createToolOutputTruncatorHook(ctx)
  const modelFallback = createModelFallbackHook(ctx)
  const preemptiveCompaction = createPreemptiveCompactionHook(ctx)
  const rulesInjector = createRulesInjectorHook(ctx)
  const claudeCodeUsageTracker = createClaudeCodeUsageTrackerHook(ctx)
  const claudeCodeQuotaGate = createClaudeCodeQuotaGateHook(ctx)

  // Combine event handlers
  const eventHandlers = [
    contextWindowMonitor.event,
    preemptiveCompaction.event,
    modelFallback.event,
    rulesInjector.event,
  ]

  const combinedEventHandler = async (args) => {
    for (const handler of eventHandlers) {
      try {
        await handler(args)
      } catch (err) {
        // console.error("[CustomHooks] Event handler error:", err)
      }
    }
  }

  // Combine tool.execute.before handlers (quota gate first so we block before recording)
  const toolBeforeHandlers = [
    claudeCodeQuotaGate["tool.execute.before"],
    claudeCodeUsageTracker["tool.execute.before"],
  ].filter(Boolean)

  const combinedToolBeforeHandler =
    toolBeforeHandlers.length > 0
      ? async (input) => {
          for (const handler of toolBeforeHandlers) {
            try {
              await handler(input, {})
            } catch (err) {
              if (err?.code === 'QUOTA_EXHAUSTED') throw err
              // Graceful degradation for other errors
            }
          }
        }
      : undefined

  // Combine tool.execute.after handlers
  const toolAfterHandlers = [
    contextWindowMonitor["tool.execute.after"],
    toolOutputTruncator["tool.execute.after"],
    preemptiveCompaction["tool.execute.after"],
    rulesInjector["tool.execute.after"],
    claudeCodeUsageTracker["tool.execute.after"],
  ]

  const combinedToolAfterHandler = async (input, output) => {
    for (const handler of toolAfterHandlers) {
      try {
        await handler(input, output)
      } catch (err) {
        // console.error("[CustomHooks] Tool handler error:", err)
      }
    }
  }

  const result = {
    event: combinedEventHandler,
    "tool.execute.after": combinedToolAfterHandler,
    "chat.message": modelFallback["chat.message"],
  }
  if (combinedToolBeforeHandler) {
    result["tool.execute.before"] = combinedToolBeforeHandler
  }
  return result
}

export default CustomHooksPlugin
