/**
 * Stores lightweight in-memory telemetry for AI assist usage so diagnostics endpoints can report counts.
 */
type AiAssistField = 'title' | 'goal' | 'context' | 'constraints'

type AiAssistMetrics = {
  total: number
  fields: Record<AiAssistField, number>
}

const GLOBAL_KEY = Symbol.for('questify.telemetry.aiAssist')

function getMetricsStore(): AiAssistMetrics {
  const globalStore = globalThis as typeof globalThis & { [GLOBAL_KEY]?: AiAssistMetrics }
  if (!globalStore[GLOBAL_KEY]) {
    globalStore[GLOBAL_KEY] = {
      total: 0,
      fields: {
        title: 0,
        goal: 0,
        context: 0,
        constraints: 0,
      },
    }
  }
  return globalStore[GLOBAL_KEY]!
}

export function recordAiAssistUsage(field: AiAssistField) {
  const store = getMetricsStore()
  store.total += 1
  store.fields[field] += 1
}

export function getAiAssistMetrics(): AiAssistMetrics {
  const store = getMetricsStore()
  return {
    total: store.total,
    fields: { ...store.fields },
  }
}
