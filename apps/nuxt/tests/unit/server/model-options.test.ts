import { describe, expect, it } from 'vitest'
import { defaultAiModels } from 'shared/ai-models'
import { getAiModelOptions, getDefaultModelId, normalizeModelType, getModelMeta } from '../../../server/utils/model-options'

describe('server/utils/model-options', () => {
  const originalRuntimeConfig = globalThis.useRuntimeConfig

  const baseConfig = {
    aiModels: defaultAiModels,
    aiModelDefaultId: undefined,
    public: { features: {} },
  }

  afterEach(() => {
    if (originalRuntimeConfig) globalThis.useRuntimeConfig = originalRuntimeConfig
  })

  it('returns enabled models and falls back to defaults when config is empty', () => {
    globalThis.useRuntimeConfig = () => ({ ...baseConfig, aiModels: [] })
    const models = getAiModelOptions()

    expect(models.length).toBeGreaterThan(0)
    expect(models.every(model => model.enabled !== false)).toBe(true)
  })

  it('throws when no models are enabled', () => {
    globalThis.useRuntimeConfig = () => ({
      ...baseConfig,
      aiModels: defaultAiModels.map(model => ({ ...model, enabled: false })),
    })

    expect(() => getAiModelOptions()).toThrow('No AI models are enabled')
  })

  it('honors explicit default id and trims values', () => {
    globalThis.useRuntimeConfig = () => ({
      ...baseConfig,
      aiModelDefaultId: '  custom-model ',
      aiModels: defaultAiModels,
    })

    expect(getDefaultModelId()).toBe('custom-model')
  })

  it('normalizes requested model ids with fallbacks and metadata lookup', () => {
    globalThis.useRuntimeConfig = () => ({ ...baseConfig })
    const normalized = normalizeModelType('  gpt-4o ')
    expect(normalized).toBe('gpt-4o')

    const fallbackNormalized = normalizeModelType('', 'gpt-4o-mini')
    expect(fallbackNormalized).toBe('gpt-4o-mini')

    expect(getModelMeta('gpt-4o-mini')?.id).toBe('gpt-4o-mini')
  })
})
