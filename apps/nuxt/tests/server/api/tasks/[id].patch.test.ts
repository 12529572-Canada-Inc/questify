import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const taskFindUniqueMock = vi.fn()
const taskUpdateMock = vi.fn()

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    task: {
      findUnique: taskFindUniqueMock,
      update: taskUpdateMock,
    },
  })),
}))

const requireUserSessionMock = vi.fn()
const getRouterParamMock = vi.fn()
const readBodyMock = vi.fn()
const createErrorMock = vi.fn()

let taskPatchHandler: (event: unknown) => Promise<unknown>

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (handler: any) => handler)
  taskPatchHandler = (await import('~/server/api/tasks/[id].patch')).default
})

beforeEach(() => {
  taskFindUniqueMock.mockReset()
  taskUpdateMock.mockReset()

  requireUserSessionMock.mockReset()
  getRouterParamMock.mockReset()
  readBodyMock.mockReset()
  createErrorMock.mockReset()
  createErrorMock.mockImplementation((error) =>
    Object.assign(new Error(error.statusMessage), error),
  )

  ;(globalThis as any).requireUserSession = requireUserSessionMock
  ;(globalThis as any).getRouterParam = getRouterParamMock
  ;(globalThis as any).readBody = readBodyMock
  ;(globalThis as any).createError = createErrorMock
})

afterEach(() => {
  delete (globalThis as any).requireUserSession
  delete (globalThis as any).getRouterParam
  delete (globalThis as any).readBody
  delete (globalThis as any).createError
})

describe('Task PATCH handler', () => {
  it('allows the quest owner to update a task to an unfinished state', async () => {
    requireUserSessionMock.mockResolvedValue({ user: { id: 'owner-1' } })
    getRouterParamMock.mockReturnValue('task-123')
    readBodyMock.mockResolvedValue({ status: 'todo' })
    taskFindUniqueMock.mockResolvedValue({ quest: { ownerId: 'owner-1' } })
    taskUpdateMock.mockResolvedValue({ id: 'task-123', status: 'todo' })

    const result = await taskPatchHandler({} as unknown)

    expect(taskUpdateMock).toHaveBeenCalledWith({
      where: { id: 'task-123' },
      data: { status: 'todo' },
    })
    expect(result).toEqual({ id: 'task-123', status: 'todo' })
  })

  it('rejects invalid task statuses', async () => {
    requireUserSessionMock.mockResolvedValue({ user: { id: 'owner-1' } })
    getRouterParamMock.mockReturnValue('task-123')
    readBodyMock.mockResolvedValue({ status: 'blocked' })
    taskFindUniqueMock.mockResolvedValue({ quest: { ownerId: 'owner-1' } })

    await expect(taskPatchHandler({} as unknown)).rejects.toThrow('Invalid task status')
  })
})
