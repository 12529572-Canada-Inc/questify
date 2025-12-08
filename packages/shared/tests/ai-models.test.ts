import { describe, expect, it } from 'vitest'
import { DEFAULT_MODEL_ID, defaultAiModels, findModelOption, resolveModelId, sanitizeModelOptions } from '../src/ai-models'

describe('ai-models helpers', () => {
  it('sanitizes invalid entries and enforces a default', () => {
    const models = sanitizeModelOptions([
      // Invalid entry should be ignored
      { id: '', label: 'Skip', provider: 'openai', providerLabel: 'OpenAI', description: '', tags: [], apiModel: '' } as never,
      defaultAiModels[1],
      { ...defaultAiModels[2], default: true },
    ])

    expect(models).toHaveLength(2)
    expect(models.some(model => model.default)).toBe(true)
  })

  it('falls back to default list when empty', () => {
    const models = sanitizeModelOptions([])
    expect(models).toEqual(defaultAiModels)
  })

  it('resolves model ids with graceful fallback', () => {
    const models = defaultAiModels
    expect(resolveModelId(models, 'non-existent')).toBe(DEFAULT_MODEL_ID)
    expect(resolveModelId(models, models[1].id)).toBe(models[1].id)
    expect(findModelOption(models, models[0].id)?.label).toBe(models[0].label)
  })

  it('assigns default to the first enabled model when initial entries are disabled', () => {
    const models = sanitizeModelOptions([
      { ...defaultAiModels[0], id: 'disabled-model', enabled: false, default: false },
      { ...defaultAiModels[1], id: 'enabled-model', enabled: true, default: false },
    ])

    expect(models.find(model => model.default)?.id).toBe('enabled-model')
  })

  it('resolves to an enabled model when the requested id is disabled', () => {
    const models = sanitizeModelOptions([
      { ...defaultAiModels[0], id: 'disabled-model', enabled: false, default: true },
      { ...defaultAiModels[1], id: 'enabled-model', enabled: true },
    ])

    expect(resolveModelId(models, 'disabled-model')).toBe('enabled-model')
    expect(resolveModelId(models, 'unknown')).toBe('enabled-model')
  })
})
