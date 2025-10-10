import type { EventHandler } from 'h3'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PrismaClientMock,
  resetPrismaMocks,
  taskFindUniqueMock,
  taskUpdateMock,
} from '../test-utils/prisma'

vi.mock('@prisma/client', () => ({
  PrismaClient: PrismaClientMock,
}))

const defineEventHandlerMock = vi.fn((handler: EventHandler) => handler)
const requireUserSessionMock = vi.fn()
const getRouterParamMock = vi.fn()
const readBodyMock = vi.fn()
const createErrorMock = vi.fn((input: { statusCode: number, statusMessage?: string }) =>
  Object.assign(new Error(input.statusMessage ?? 'Error'), input),
)

let handler: EventHandler

describe('PATCH /api/tasks/[id]', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', defineEventHandlerMock)
    handler = (await import('~/server/api/tasks/[id].patch')).default
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    resetPrismaMocks()
    defineEventHandlerMock.mockClear()
    requireUserSessionMock.mockReset()
    getRouterParamMock.mockReset()
    readBodyMock.mockReset()
    createErrorMock.mockClear()

    vi.stubGlobal('defineEventHandler', defineEventHandlerMock)
    vi.stubGlobal('requireUserSession', requireUserSessionMock)
    vi.stubGlobal('getRouterParam', getRouterParamMock)
    vi.stubGlobal('readBody', readBodyMock)
    vi.stubGlobal('createError', createErrorMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('blocks non-owners from updating a task', async () => {
    requireUserSessionMock.mockResolvedValue({ user: { id: 'user-2' } })
    getRouterParamMock.mockReturnValue('task-5')
    taskFindUniqueMock.mockResolvedValue({ quest: { ownerId: 'owner-7' } })
    readBodyMock.mockResolvedValue({ status: 'completed' })

    await expect(handler({} as unknown)).rejects.toMatchObject({ statusCode: 403 })
    expect(taskUpdateMock).not.toHaveBeenCalled()
  })

  it('allows the quest owner to update the task status', async () => {
    const updatedTask = { id: 'task-5', status: 'completed' }

    requireUserSessionMock.mockResolvedValue({ user: { id: 'owner-7' } })
    getRouterParamMock.mockReturnValue('task-5')
    taskFindUniqueMock.mockResolvedValue({ quest: { ownerId: 'owner-7' } })
    readBodyMock.mockResolvedValue({ status: 'completed' })
    taskUpdateMock.mockResolvedValue(updatedTask)

    const result = await handler({} as unknown)

    expect(result).toEqual(updatedTask)
    expect(taskUpdateMock).toHaveBeenCalledWith({
      where: { id: 'task-5' },
      data: { status: 'completed' },
    })
  })
})
