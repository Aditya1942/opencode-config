/**
 * Custom Hooks Plugin for OpenCode
 *
 * Combines standalone implementations of oh-my-opencode hooks:
 * - tool-output-truncator: Truncates large outputs
 * - model-fallback: Falls back to alternative models
 * - rules-injector: Injects project rules
 */

import { createToolOutputTruncatorHook } from "./hooks/tool-output-truncator.js"
import { createModelFallbackHook } from "./hooks/model-fallback.js"
import { createRulesInjectorHook } from "./hooks/rules-injector.js"

export const CustomHooksPlugin = async (ctx) => {
  const toolOutputTruncator = createToolOutputTruncatorHook(ctx)
  const modelFallback = createModelFallbackHook(ctx)
  const rulesInjector = createRulesInjectorHook(ctx)

  const eventHandlers = [modelFallback.event, rulesInjector.event]

  const combinedEventHandler = async (args) => {
    for (const handler of eventHandlers) {
      try {
        await handler(args)
      } catch (err) {
        // console.error("[CustomHooks] Event handler error:", err)
      }
    }
  }

  const toolAfterHandlers = [
    toolOutputTruncator["tool.execute.after"],
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
