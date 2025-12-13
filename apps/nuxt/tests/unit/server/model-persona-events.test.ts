import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../server/api/models/personas/event.post'
import * as telemetry from '../../../server/utils/persona-telemetry'

describe('server/api/models/personas/event.post', () => {
  const globalStore = globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown, readBody?: (...args: unknown[]) => unknown }
  const originalRuntimeConfig = globalStore.useRuntimeConfig
  const originalReadBody = globalStore.readBody
  type HandlerEvent = Parameters<typeof handler>[0]

  beforeEach(() => {
    Reflect.set(globalStore, 'useRuntimeConfig', () => ({
      public: { features: { modelPersonas: true } },
    }))
  })

  afterEach(() => {
    if (originalRuntimeConfig) Reflect.set(globalStore, 'useRuntimeConfig', originalRuntimeConfig)
    if (originalReadBody) Reflect.set(globalStore, 'readBody', originalReadBody)
  })

  it('records a valid persona event', async () => {
    const spy = vi.spyOn(telemetry, 'recordModelPersonaEvent').mockImplementation(() => {})
    Reflect.set(globalStore, 'readBody', vi.fn(async () => ({
      event: 'model_persona_selected',
      attributes: {
        personaKey: 'swift-scout',
        provider: 'openai',
        modelId: 'gpt-4o-mini',
        surface: 'quest-create',
        environment: 'test',
      },
    })))

    await handler({} as HandlerEvent)

    expect(spy).toHaveBeenCalledWith('model_persona_selected', expect.objectContaining({
      personaKey: 'swift-scout',
      modelId: 'gpt-4o-mini',
    }))
  })

  it('rejects an invalid event name', async () => {
    Reflect.set(globalStore, 'readBody', vi.fn(async () => ({
      event: 'bad_event',
      attributes: { personaKey: 'x' },
    })))

    await expect(handler({} as HandlerEvent)).rejects.toHaveProperty('statusCode', 400)
  })

  it('rejects missing persona key', async () => {
    Reflect.set(globalStore, 'readBody', vi.fn(async () => ({
      event: 'model_persona_hovered',
      attributes: { personaKey: '' },
    })))

    await expect(handler({} as HandlerEvent)).rejects.toHaveProperty('statusCode', 400)
  })

  it('skips when feature flag is disabled', async () => {
    Reflect.set(globalStore, 'useRuntimeConfig', () => ({
      public: { features: { modelPersonas: false } },
    }))
    const spy = vi.spyOn(telemetry, 'recordModelPersonaEvent').mockImplementation(() => {})
    Reflect.set(globalStore, 'readBody', vi.fn(async () => ({
      event: 'model_persona_hovered',
      attributes: { personaKey: 'swift-scout' },
    })))

    const result = await handler({} as HandlerEvent)

    expect(result).toEqual({ success: true, skipped: true })
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects when event name is missing', async () => {
    Reflect.set(globalStore, 'readBody', vi.fn(async () => ({})))

    await expect(handler({} as HandlerEvent)).rejects.toHaveProperty('statusCode', 400)
  })
})
