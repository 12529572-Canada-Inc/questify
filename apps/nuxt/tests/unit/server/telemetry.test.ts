import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getAiAssistMetrics, recordAiAssistUsage } from '../../../server/utils/telemetry'

describe('server/utils/telemetry', () => {
  beforeEach(() => {
    const telemetryKey = Symbol.for('questify.telemetry.aiAssist')
    const globalStore = globalThis as typeof globalThis & { [key: symbol]: unknown }
    globalStore[telemetryKey] = {
      total: 0,
      fields: {
        title: 0,
        goal: 0,
        context: 0,
        constraints: 0,
      },
    }
  })

  afterEach(() => {
    const telemetryKey = Symbol.for('questify.telemetry.aiAssist')
    const globalStore = globalThis as typeof globalThis & { [key: symbol]: unknown }
    globalStore[telemetryKey] = {
      total: 0,
      fields: {
        title: 0,
        goal: 0,
        context: 0,
        constraints: 0,
      },
    }
  })

  it('tracks totals per field', () => {
    recordAiAssistUsage('title')
    recordAiAssistUsage('context')
    recordAiAssistUsage('title')

    expect(getAiAssistMetrics()).toEqual({
      total: 3,
      fields: {
        title: 2,
        goal: 0,
        context: 1,
        constraints: 0,
      },
    })
  })

  it('returns a copy of metrics to avoid external mutation', () => {
    recordAiAssistUsage('goal')
    const metrics = getAiAssistMetrics()

    metrics.fields.goal = 99
    metrics.total = 123

    expect(getAiAssistMetrics()).toEqual({
      total: 1,
      fields: {
        title: 0,
        goal: 1,
        context: 0,
        constraints: 0,
      },
    })
  })
})
