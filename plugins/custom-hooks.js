/**
 * Custom Hooks Plugin for OpenCode
 * 
 * Combines standalone implementations of oh-my-opencode hooks:
 * - context-window-monitor: Warns at 70% context usage
 * - tool-output-truncator: Truncates large outputs
 * - model-fallback: Falls back to alternative models
 * - preemptive-compaction: Auto-compacts at 78% usage
 * - rules-injector: Injects project rules
 */

import { createContextWindowMonitorHook } from "./hooks/context-window-monitor.js"
import { createToolOutputTruncatorHook } from "./hooks/tool-output-truncator.js"
import { createModelFallbackHook } from "./hooks/model-fallback.js"
import { createPreemptiveCompactionHook } from "./hooks/preemptive-compaction.js"
import { createRulesInjectorHook } from "./hooks/rules-injector.js"

export const CustomHooksPlugin = async (ctx) => {
  // Initialize all hooks
  const contextWindowMonitor = createContextWindowMonitorHook(ctx)
  const toolOutputTruncator = createToolOutputTruncatorHook(ctx)
  const modelFallback = createModelFallbackHook(ctx)
  const preemptiveCompaction = createPreemptiveCompactionHook(ctx)
  const rulesInjector = createRulesInjectorHook(ctx)

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

  // Combine tool.execute.after handlers
  const toolAfterHandlers = [
    contextWindowMonitor["tool.execute.after"],
    toolOutputTruncator["tool.execute.after"],
    preemptiveCompaction["tool.execute.after"],
    rulesInjector["tool.execute.after"],
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

  return {
    event: combinedEventHandler,
    "tool.execute.after": combinedToolAfterHandler,
    "chat.message": modelFallback["chat.message"],
  }
}

export default CustomHooksPlugin
