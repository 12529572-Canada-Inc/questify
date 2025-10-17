import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest'
import handler from '../../server/api/tasks/[id]/investigations.post'

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>
type GetRouterParamMock = (event: unknown, name: string) => string

const globalWithMocks = globalThis as typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
  getRouterParam?: GetRouterParamMock
}

const prismaMocks = vi.hoisted(() => ({
  taskFindUniqueMock: vi.fn(),
  taskInvestigationCreateMock: vi.fn(),
}))

const { taskFindUniqueMock, taskInvestigationCreateMock } = prismaMocks

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    task = {
      findUnique: prismaMocks.taskFindUniqueMock,
    }

    taskInvestigation = {
      create: prismaMocks.taskInvestigationCreateMock,
    }
  },
}))

const addMock = vi.fn()
const originalRequireUserSession = globalWithMocks.requireUserSession
const originalGetRouterParam = globalWithMocks.getRouterParam

describe('API /api/tasks/[id]/investigations.post', () => {
  beforeEach(() => {
    taskFindUniqueMock.mockReset()
    taskInvestigationCreateMock.mockReset()
    addMock.mockReset()

    globalWithMocks.requireUserSession = vi.fn(async () => ({
      user: { id: 'user-1' },
    }))

    globalWithMocks.getRouterParam = vi.fn(() => 'task-1')
    taskFindUniqueMock.mockResolvedValue({
      id: 'task-1',
      quest: { ownerId: 'user-1' },
    })
    taskInvestigationCreateMock.mockResolvedValue({
      id: 'inv-1',
      status: 'pending',
    })
  })

  afterEach(() => {
    if (originalRequireUserSession) globalWithMocks.requireUserSession = originalRequireUserSession
    else delete globalWithMocks.requireUserSession

    if (originalGetRouterParam) globalWithMocks.getRouterParam = originalGetRouterParam
    else delete globalWithMocks.getRouterParam
  })

  it('creates an investigation record and enqueues a job', async () => {
    const mockEvent = {
      context: {
        taskQueue: {
          add: addMock,
        },
      },
    } as unknown as Parameters<typeof handler>[0]

    const response = await handler(mockEvent)

    expect(taskFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      select: {
        id: true,
        quest: {
          select: {
            ownerId: true,
          },
        },
      },
    })
    expect(taskInvestigationCreateMock).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        initiatedById: 'user-1',
        status: 'pending',
      },
    })
    expect(addMock).toHaveBeenCalledWith('investigate-task', {
      investigationId: 'inv-1',
      taskId: 'task-1',
    })
    expect(response.investigation).toEqual({ id: 'inv-1', status: 'pending' })
  })
})
