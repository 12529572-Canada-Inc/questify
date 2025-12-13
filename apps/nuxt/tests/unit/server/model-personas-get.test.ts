import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../server/api/models/personas.get'
import { loadModelPersonas, mergePersonasWithModels } from 'shared/server'
import { defaultAiModels } from 'shared/ai-models'

vi.mock('shared/server', async () => {
  const actual = await vi.importActual<typeof import('shared/server')>('shared/server')
  return {
    ...actual,
    loadModelPersonas: vi.fn(async () => [
      {
        key: 'test-persona',
        name: 'Test Persona',
        tagline: 'Tagline',
        bestFor: [],
        speed: 'fast',
        cost: 'low',
        contextLength: 'medium',
        provider: 'openai',
        modelId: 'gpt-4o-mini',
        recommended: true,
      },
    ]),
  }
})

describe('server/api/models/personas.get', () => {
  const originalRuntimeConfig = globalThis.useRuntimeConfig

  beforeEach(() => {
    globalThis.useRuntimeConfig = () => ({
      aiModels: undefined,
      public: {
        aiModels: [],
        features: {
          modelPersonas: true,
          modelPersonasVariant: 'pilot',
        },
      },
    })
  })

  afterEach(() => {
    if (originalRuntimeConfig) globalThis.useRuntimeConfig = originalRuntimeConfig
  })

  it('returns merged personas with defaults and recommended key', async () => {
    vi.mocked(loadModelPersonas).mockResolvedValue([
      {
        key: 'test-persona',
        name: 'Test Persona',
        tagline: 'Tagline',
        bestFor: [],
        speed: 'fast',
        cost: 'low',
        contextLength: 'medium',
        provider: 'openai',
        modelId: 'gpt-4o-mini',
        recommended: true,
      },
    ])

    const result = await handler({} as any)

    expect(result.featureEnabled).toBe(true)
    expect(result.variant).toBe('pilot')
    expect(result.personas.some(p => p.key === 'test-persona')).toBe(true)
    expect(result.recommendedKey).toBe('test-persona')
  })

  it('uses provided aiModels when present', async () => {
    const customModels = defaultAiModels.slice(0, 1)
    globalThis.useRuntimeConfig = () => ({
      aiModels: customModels,
      public: {
        aiModels: customModels,
        features: {
          modelPersonas: true,
          modelPersonasVariant: 'full',
        },
      },
    })

    const result = await handler({} as any)
    const merged = mergePersonasWithModels([{ key: 'test-persona', name: 'Test Persona', tagline: '', bestFor: [], speed: 'fast', cost: 'low', contextLength: 'medium', provider: 'openai', modelId: 'gpt-4o-mini' }], customModels)

    expect(result.variant).toBe('full')
    expect(result.personas.map(p => p.key)).toEqual(merged.map(p => p.key))
  })

  it('falls back to first enabled persona when none are recommended', async () => {
    vi.mocked(loadModelPersonas).mockResolvedValue([
      {
        key: 'fallback-persona',
        name: 'Fallback Persona',
        tagline: 'Tagline',
        bestFor: [],
        speed: 'fast',
        cost: 'low',
        contextLength: 'medium',
        provider: 'openai',
        modelId: 'gpt-4o',
        recommended: false,
      },
    ])
    const singleModel = [{
      id: 'gpt-4o',
      label: 'GPT-4o',
      provider: 'openai',
      providerLabel: 'OpenAI',
      description: '',
      tags: [],
      apiModel: 'gpt-4o',
      enabled: true,
    }]
    globalThis.useRuntimeConfig = () => ({
      aiModels: singleModel,
      public: {
        aiModels: singleModel,
        features: {
          modelPersonas: true,
          modelPersonasVariant: 'pilot',
        },
      },
    })

    const result = await handler({} as any)

    expect(result.recommendedKey).toBe('fallback-persona')
  })
})
