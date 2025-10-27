import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestStatus } from '@prisma/client'
import handler from '../../server/api/quests/index.get'

type GetUserSessionMock = (event: unknown) => Promise<{ user?: { id: string } } | null>
type GetQueryMock = (event: unknown) => Record<string, unknown>

type GlobalWithMocks = typeof globalThis & {
  getUserSession?: GetUserSessionMock
  getQuery?: GetQueryMock
}

const prismaMocks = vi.hoisted(() => ({
  questFindMany: vi.fn(),
}))

const questStatusMock = vi.hoisted(() => ({
  draft: 'draft',
  active: 'active',
  completed: 'completed',
  failed: 'failed',
  archived: 'archived',
} as const))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    quest = {
      findMany: prismaMocks.questFindMany,
    }
  },
  QuestStatus: questStatusMock,
}))

const globalWithMocks = globalThis as GlobalWithMocks
const originalGetUserSession = globalWithMocks.getUserSession
const originalGetQuery = globalWithMocks.getQuery

beforeEach(() => {
  prismaMocks.questFindMany.mockReset()
  prismaMocks.questFindMany.mockResolvedValue([
    { id: 'quest-1', title: 'Quest Alpha', status: 'active' },
  ])

  Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => null))
  Reflect.set(globalWithMocks, 'getQuery', vi.fn(() => ({})))
})

afterEach(() => {
  if (originalGetUserSession) Reflect.set(globalWithMocks, 'getUserSession', originalGetUserSession)
  else Reflect.deleteProperty(globalWithMocks, 'getUserSession')

  if (originalGetQuery) Reflect.set(globalWithMocks, 'getQuery', originalGetQuery)
  else Reflect.deleteProperty(globalWithMocks, 'getQuery')
})

describe('API /api/quests (GET)', () => {
  it('only returns public quests to anonymous users', async () => {
    await expect(handler({} as never)).resolves.toEqual([
      { id: 'quest-1', title: 'Quest Alpha', status: 'active' },
    ])
    expect(prismaMocks.questFindMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        status: { not: QuestStatus.archived },
        isPublic: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('returns both owned and public quests to authenticated users', async () => {
    Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => ({ user: { id: 'user-1' } })))

    await handler({} as never)

    expect(prismaMocks.questFindMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        status: { not: QuestStatus.archived },
        OR: [
          { ownerId: 'user-1' },
          { isPublic: true, status: { not: QuestStatus.archived } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('includes archived quests when requested by the owner', async () => {
    Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => ({ user: { id: 'user-99' } })))
    Reflect.set(globalWithMocks, 'getQuery', vi.fn(() => ({ includeArchived: 'true' })))

    await handler({} as never)

    expect(prismaMocks.questFindMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          { ownerId: 'user-99' },
          { isPublic: true, status: { not: QuestStatus.archived } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })
  })
})
