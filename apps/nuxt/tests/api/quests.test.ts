import { describe, it, expect, vi } from 'vitest'
import handler from '../../server/api/quests/index.get'

vi.mock('@prisma/client', async () => {
  console.log('[Test] Mocking PrismaClient in test file')

  return {
    PrismaClient: class {
      quest = {
        findMany: async () => [
          { id: 'mock-1', title: 'Questify Mock', description: 'Mocked quest', status: 'active' },
        ],
      }
    },
  }
})

describe('API /api/quests', () => {
  it('returns mocked quest data', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockEvent = {} as any
    const result = await handler(mockEvent)

    expect(result[0]?.title).toBe('Questify Mock')
  })
})
