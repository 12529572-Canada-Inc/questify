import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/tasks/index.get'

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
}

const prismaMocks = vi.hoisted(() => ({
  taskFindMany: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    task = {
      findMany: prismaMocks.taskFindMany,
    }
  },
}))

const globalWithMocks = globalThis as GlobalWithMocks
const originalRequireUserSession = globalWithMocks.requireUserSession

const sampleTasks = [
  {
    id: 'task-1',
    title: 'Draft launch checklist',
    details: 'List items needed before launch',
    extraContent: null,
    questId: 'quest-1',
    status: 'todo',
    order: 1,
    createdAt: new Date('2024-01-01T12:00:00Z'),
    quest: {
      id: 'quest-1',
      title: 'Launch prep',
      status: 'active',
    },
  },
  {
    id: 'task-2',
    title: 'Ship release',
    details: 'Cut the release build',
    extraContent: 'Coordinate with QA',
    questId: 'quest-1',
    status: 'pending',
    order: 2,
    createdAt: new Date('2024-01-02T12:00:00Z'),
    quest: {
      id: 'quest-1',
      title: 'Launch prep',
      status: 'active',
    },
  },
]

beforeEach(() => {
  prismaMocks.taskFindMany.mockReset()
  prismaMocks.taskFindMany.mockResolvedValue(sampleTasks)

  Reflect.set(globalWithMocks, 'requireUserSession', vi.fn(async () => ({
    user: { id: 'user-1' },
  })))
})

afterEach(() => {
  prismaMocks.taskFindMany.mockReset()

  if (originalRequireUserSession) {
    Reflect.set(globalWithMocks, 'requireUserSession', originalRequireUserSession)
  }
  else {
    Reflect.deleteProperty(globalWithMocks, 'requireUserSession')
  }
})

describe('API /api/tasks (GET)', () => {
  it('returns tasks owned by the current user ordered by created date', async () => {
    const event = { path: '/api/tasks' } as never

    const result = await handler(event)

    expect(globalWithMocks.requireUserSession).toHaveBeenCalledWith(event)
    expect(prismaMocks.taskFindMany).toHaveBeenCalledWith({
      where: { quest: { ownerId: 'user-1' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        details: true,
        extraContent: true,
        questId: true,
        status: true,
        order: true,
        createdAt: true,
        quest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })
    expect(result).toEqual(sampleTasks)
  })
})
