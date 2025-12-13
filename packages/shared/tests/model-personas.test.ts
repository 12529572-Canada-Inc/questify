import { describe, expect, it } from 'vitest'
import { defaultAiModels } from '../src/ai-models'
import {
  defaultModelPersonas,
  findPersona,
  mergePersonasWithModels,
  sanitizeModelPersonas,
  type ModelPersona,
} from '../src/model-personas'

describe('model-personas', () => {
  const basePersona: ModelPersona = {
    key: 'tester',
    name: 'Tester',
    tagline: 'Tagline',
    bestFor: [' One ', ''],
    speed: 'fast',
    cost: 'medium',
    contextLength: 'medium',
    provider: 'openai',
    modelId: 'gpt-4o',
    recommended: true,
  }

  it('sanitizes personas and falls back to defaults when empty', () => {
    expect(sanitizeModelPersonas(null).length).toBe(defaultModelPersonas.length)

    const sanitized = sanitizeModelPersonas([
      basePersona,
      { ...basePersona, key: 'dup', provider: 'unknown' as any },
      { ...basePersona, key: 'tester', modelId: '' },
    ])

    expect(sanitized).toHaveLength(1)
    expect(sanitized[0].bestFor).toEqual(['One'])
    expect(sanitized[0].name).toBe('Tester')
    expect(sanitized[0].recommended).toBe(true)
  })

  it('finds personas by trimmed key', () => {
    const personas = sanitizeModelPersonas([basePersona])
    expect(findPersona(personas, ' tester ')).toEqual(personas[0])
    expect(findPersona(personas, '')).toBeNull()
  })

  it('merges personas with models and sets disabled reason', () => {
    const models = defaultAiModels.slice(0, 2).map(model => ({ ...model, enabled: model.id !== 'gpt-4o' }))
    const personas = [
      { ...basePersona, disabledReason: null },
      { ...basePersona, key: 'other', modelId: 'missing-model', provider: 'openai' },
    ]

    const merged = mergePersonasWithModels(personas, models)
    const tester = merged.find(item => item.key === 'tester')
    const fallback = merged.find(item => item.key === models[0].id)

    expect(tester?.enabled).toBe(false)
    expect(tester?.disabledReason).toBe('Provider not configured')
    expect(fallback?.key).toBe(models[0].id)
    expect(fallback?.tags).toEqual(models[0].tags)
  })
})
