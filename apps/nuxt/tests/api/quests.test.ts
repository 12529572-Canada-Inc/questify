import { describe, it, expect, vi } from 'vitest'

// Now import the actual route handler after the mock
import handler from '../../server/api/quests/index.get'

// Ensure the Prisma mock applies before the route loads
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
    const result = await handler({} as unknown) // mock event
    console.log('🧪 Result:', result)
    expect(result[0].title).toBe('Questify Mock')
  }, 10_000)
})
