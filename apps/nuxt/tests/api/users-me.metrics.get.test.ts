import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/users/me/metrics.get'

type GetUserSessionMock = (event?: unknown) => Promise<{ user?: { id: string } } | null>

type GlobalWithMocks = typeof globalThis & {
  getUserSession?: GetUserSessionMock
}

const prismaMocks = vi.hoisted(() => ({
  questCount: vi.fn(),
  taskCount: vi.fn(),
  questFindFirst: vi.fn(),
}))

vi.mock('shared/server', async () => {
  const actual = await vi.importActual<typeof import('shared/server')>('shared/server')
  return {
    ...actual,
    prisma: {
      quest: {
        count: prismaMocks.questCount,
        findFirst: prismaMocks.questFindFirst,
      },
      task: {
        count: prismaMocks.taskCount,
      },
      $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
    },
  }
})

const globalWithMocks = globalThis as GlobalWithMocks
const originalGetUserSession = globalWithMocks.getUserSession

beforeEach(() => {
  prismaMocks.questCount.mockReset()
  prismaMocks.taskCount.mockReset()
  prismaMocks.questFindFirst.mockReset()

  prismaMocks.questCount
    .mockResolvedValueOnce(5) // total quests
    .mockResolvedValueOnce(3) // active quests
    .mockResolvedValueOnce(1) // completed quests
    .mockResolvedValueOnce(2) // public quests
  prismaMocks.taskCount
    .mockResolvedValueOnce(10) // total tasks
    .mockResolvedValueOnce(4) // completed tasks
  prismaMocks.questFindFirst.mockResolvedValue({ updatedAt: new Date('2024-06-01T12:00:00Z') })

  Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => ({
    user: { id: 'user-1' },
  })))
})

afterEach(() => {
  if (originalGetUserSession) {
    Reflect.set(globalWithMocks, 'getUserSession', originalGetUserSession)
  }
  else {
    Reflect.deleteProperty(globalWithMocks, 'getUserSession')
  }
})

describe('API /api/users/me/metrics (GET)', () => {
  it('returns user metrics when authenticated', async () => {
    const result = await handler({} as never)

    expect(prismaMocks.questCount).toHaveBeenCalledTimes(4)
    expect(prismaMocks.taskCount).toHaveBeenCalledTimes(2)
    expect(prismaMocks.questFindFirst).toHaveBeenCalledWith({
      where: { ownerId: 'user-1', deletedAt: null },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    expect(result).toEqual({
      totalQuests: 5,
      activeQuests: 3,
      completedQuests: 1,
      publicQuests: 2,
      totalTasks: 10,
      completedTasks: 4,
      completionRate: 0.4,
      privateQuests: 3,
      lastActiveAt: '2024-06-01T12:00:00.000Z',
    })
  })

  it('rejects unauthenticated requests', async () => {
    Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => null))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 401 })
  })
})
