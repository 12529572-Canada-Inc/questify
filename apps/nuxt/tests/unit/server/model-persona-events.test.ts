import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../server/api/models/personas/event.post'
import * as telemetry from '../../../server/utils/persona-telemetry'

describe('server/api/models/personas/event.post', () => {
  const originalRuntimeConfig = globalThis.useRuntimeConfig
  const originalReadBody = globalThis.readBody

  beforeEach(() => {
    globalThis.useRuntimeConfig = () => ({
      public: { features: { modelPersonas: true } },
    })
  })

  afterEach(() => {
    if (originalRuntimeConfig) globalThis.useRuntimeConfig = originalRuntimeConfig
    if (originalReadBody) globalThis.readBody = originalReadBody
  })

  it('records a valid persona event', async () => {
    const spy = vi.spyOn(telemetry, 'recordModelPersonaEvent').mockImplementation(() => {})
    globalThis.readBody = vi.fn(async () => ({
      event: 'model_persona_selected',
      attributes: {
        personaKey: 'swift-scout',
        provider: 'openai',
        modelId: 'gpt-4o-mini',
        surface: 'quest-create',
        environment: 'test',
      },
    }))

    await handler({} as any)

    expect(spy).toHaveBeenCalledWith('model_persona_selected', expect.objectContaining({
      personaKey: 'swift-scout',
      modelId: 'gpt-4o-mini',
    }))
  })

  it('rejects an invalid event name', async () => {
    globalThis.readBody = vi.fn(async () => ({
      event: 'bad_event',
      attributes: { personaKey: 'x' },
    }))

    await expect(handler({} as any)).rejects.toHaveProperty('statusCode', 400)
  })

  it('rejects missing persona key', async () => {
    globalThis.readBody = vi.fn(async () => ({
      event: 'model_persona_hovered',
      attributes: { personaKey: '' },
    }))

    await expect(handler({} as any)).rejects.toHaveProperty('statusCode', 400)
  })

  it('skips when feature flag is disabled', async () => {
    globalThis.useRuntimeConfig = () => ({
      public: { features: { modelPersonas: false } },
    })
    const spy = vi.spyOn(telemetry, 'recordModelPersonaEvent').mockImplementation(() => {})
    globalThis.readBody = vi.fn(async () => ({
      event: 'model_persona_hovered',
      attributes: { personaKey: 'swift-scout' },
    }))

    const result = await handler({} as any)

    expect(result).toEqual({ success: true, skipped: true })
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects when event name is missing', async () => {
    globalThis.readBody = vi.fn(async () => ({}))

    await expect(handler({} as any)).rejects.toHaveProperty('statusCode', 400)
  })
})
