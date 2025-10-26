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
})
