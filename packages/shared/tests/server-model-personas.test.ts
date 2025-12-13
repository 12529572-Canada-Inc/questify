import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadModelPersonas } from '../src/server/model-personas'
import { defaultModelPersonas } from '../src/model-personas'

const findMany = vi.hoisted(() => vi.fn())
vi.mock('../src/server/prisma', () => ({
  prisma: {
    modelPersona: { findMany },
  },
}))

describe('server/model-personas', () => {
  beforeEach(() => {
    findMany.mockReset()
  })

  it('returns default personas when database is empty', async () => {
    findMany.mockResolvedValueOnce([])

    const personas = await loadModelPersonas()

    expect(findMany).toHaveBeenCalled()
    expect(personas).toEqual(defaultModelPersonas)
  })

  it('hydrates personas from database records', async () => {
    findMany.mockResolvedValueOnce([
      {
        key: 'db-persona',
        name: 'DB Persona',
        tagline: 'From DB',
        bestFor: ['A'],
        speed: 'fast',
        cost: 'low',
        contextLength: 'medium',
        provider: 'openai',
        modelId: 'gpt-4o',
        active: true,
      },
    ])

    const personas = await loadModelPersonas()

    expect(personas[0]).toMatchObject({
      key: 'db-persona',
      enabled: true,
    })
  })

  it('falls back to defaults on errors', async () => {
    findMany.mockRejectedValueOnce(new Error('db down'))

    const personas = await loadModelPersonas()

    expect(personas).toEqual(defaultModelPersonas)
  })
})
