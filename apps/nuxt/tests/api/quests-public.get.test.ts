import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/quests/public.get'

type GetQueryMock = (event: unknown) => Record<string, unknown>

type GlobalWithQuery = typeof globalThis & {
  getQuery?: GetQueryMock
}

const prismaMocks = vi.hoisted(() => ({
  questCount: vi.fn(),
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
      count: prismaMocks.questCount,
      findMany: prismaMocks.questFindMany,
    }
  },
  QuestStatus: questStatusMock,
}))

const globalWithQuery = globalThis as GlobalWithQuery
const originalGetQuery = globalWithQuery.getQuery

const sampleQuest = {
  id: 'quest-1',
  ownerId: 'user-1',
  title: 'Community Garden',
  goal: 'Grow vegetables for the neighbourhood',
  context: null,
  constraints: null,
  status: 'active',
  isPublic: true,
  createdAt: new Date('2025-01-10T00:00:00.000Z'),
  updatedAt: new Date('2025-01-12T00:00:00.000Z'),
  owner: {
    id: 'user-1',
    name: 'Ada Lovelace',
  },
  tasks: [
    { id: 'task-1', status: 'todo' },
    { id: 'task-2', status: 'completed' },
  ],
}

beforeEach(() => {
  prismaMocks.questCount.mockReset().mockResolvedValue(1)
  prismaMocks.questFindMany.mockReset().mockResolvedValue([sampleQuest])
  Reflect.set(globalWithQuery, 'getQuery', vi.fn(() => ({})))
})

afterEach(() => {
  if (originalGetQuery) {
    Reflect.set(globalWithQuery, 'getQuery', originalGetQuery)
  }
  else {
    Reflect.deleteProperty(globalWithQuery, 'getQuery')
  }
})

describe('API /api/quests/public (GET)', () => {
  it('returns public quests with metadata and derived task counts', async () => {
    const result = await handler({} as never)

    expect(prismaMocks.questCount).toHaveBeenCalledWith({
      where: {
        isPublic: true,
        deletedAt: null,
        status: { not: questStatusMock.archived },
      },
    })

    expect(prismaMocks.questFindMany).toHaveBeenCalledWith({
      where: {
        isPublic: true,
        deletedAt: null,
        status: { not: questStatusMock.archived },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip: 0,
      take: 12,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    expect(result).toEqual({
      data: [
        {
          id: 'quest-1',
          ownerId: 'user-1',
          title: 'Community Garden',
          goal: 'Grow vegetables for the neighbourhood',
          context: null,
          constraints: null,
          status: 'active',
          isPublic: true,
          createdAt: new Date('2025-01-10T00:00:00.000Z'),
          updatedAt: new Date('2025-01-12T00:00:00.000Z'),
          owner: {
            id: 'user-1',
            name: 'Ada Lovelace',
          },
          taskCounts: {
            total: 2,
            todo: 1,
            inProgress: 0,
            completed: 1,
          },
        },
      ],
      meta: {
        page: 1,
        pageSize: 12,
        total: 1,
        totalPages: 1,
        sort: 'newest',
        search: null,
        status: null,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
  })

  it('applies search and status filters when provided', async () => {
    Reflect.set(globalWithQuery, 'getQuery', vi.fn(() => ({
      search: 'garden',
      status: 'active,completed',
    })))

    await handler({} as never)

    expect(prismaMocks.questFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        isPublic: true,
        deletedAt: null,
        status: { in: ['active', 'completed'] },
        OR: expect.arrayContaining([
          { title: { contains: 'garden', mode: 'insensitive' } },
          { goal: { contains: 'garden', mode: 'insensitive' } },
          {
            owner: {
              name: { contains: 'garden', mode: 'insensitive' },
            },
          },
        ]),
      },
    }))
  })

  it('supports custom pagination and popular sorting', async () => {
    Reflect.set(globalWithQuery, 'getQuery', vi.fn(() => ({
      page: '2',
      pageSize: '20',
      sort: 'popular',
    })))

    prismaMocks.questCount.mockResolvedValue(45)
    await handler({} as never)

    expect(prismaMocks.questFindMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [
        { tasks: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
      skip: 20,
      take: 20,
    }))
  })
})
