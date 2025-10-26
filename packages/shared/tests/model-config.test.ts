import { describe, expect, it } from 'vitest'
import { loadModelConfig } from '../src/model-config'

describe('loadModelConfig', () => {
  it('prefers JSON override when provided', () => {
    const json = JSON.stringify([
      {
        id: 'custom-model',
        label: 'Custom Model',
        provider: 'openai',
        providerLabel: 'OpenAI',
        description: 'Testing override',
        tags: [],
        apiModel: 'custom-model',
        default: true,
      },
    ])

    const config = loadModelConfig({ jsonOverride: json })
    expect(config.models[0].id).toBe('custom-model')
    expect(config.defaultModelId).toBe('custom-model')
    expect(config.source).toBe('env-json')
  })

  it('falls back to defaults when overrides are invalid', () => {
    const config = loadModelConfig({ jsonOverride: 'not json', fileOverride: 'missing.json' })
    expect(config.models.length).toBeGreaterThan(0)
    expect(config.source).toBe('default')
  })
})
