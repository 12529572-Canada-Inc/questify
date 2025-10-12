import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const questFindUniqueMock = vi.fn()
const questUpdateMock = vi.fn()
const taskUpdateManyMock = vi.fn()
const transactionMock = vi.fn()

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    quest: {
      findUnique: questFindUniqueMock,
      update: questUpdateMock,
    },
    task: {
      updateMany: taskUpdateManyMock,
    },
    $transaction: transactionMock,
  })),
}))

const requireUserSessionMock = vi.fn()
const getRouterParamMock = vi.fn()
const readBodyMock = vi.fn()
const createErrorMock = vi.fn()

let questPatchHandler: (event: unknown) => Promise<unknown>

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (handler: any) => handler)
  questPatchHandler = (await import('~/server/api/quests/[id].patch')).default
})

beforeEach(() => {
  questFindUniqueMock.mockReset()
  questUpdateMock.mockReset()
  taskUpdateManyMock.mockReset()
  transactionMock.mockReset()

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

describe('Quest PATCH handler', () => {
  it('reopens a quest and resets completed tasks to todo', async () => {
    requireUserSessionMock.mockResolvedValue({ user: { id: 'owner-1' } })
    getRouterParamMock.mockReturnValue('quest-123')
    readBodyMock.mockResolvedValue({ status: 'active' })
    questFindUniqueMock.mockResolvedValue({ ownerId: 'owner-1' })
    questUpdateMock.mockResolvedValue({ id: 'quest-123', status: 'active' })
    taskUpdateManyMock.mockResolvedValue({ count: 2 })
    transactionMock.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    )

    const result = await questPatchHandler({} as unknown)

    expect(questUpdateMock).toHaveBeenCalledWith({
      where: { id: 'quest-123' },
      data: { status: 'active' },
    })
    expect(taskUpdateManyMock).toHaveBeenCalledWith({
      where: { questId: 'quest-123', status: 'completed' },
      data: { status: 'todo' },
    })
    expect(result).toEqual({ id: 'quest-123', status: 'active' })
  })

  it('completes a quest and propagates the status to every task', async () => {
    requireUserSessionMock.mockResolvedValue({ user: { id: 'owner-1' } })
    getRouterParamMock.mockReturnValue('quest-123')
    readBodyMock.mockResolvedValue({ status: 'completed' })
    questFindUniqueMock.mockResolvedValue({ ownerId: 'owner-1' })
    questUpdateMock.mockResolvedValue({ id: 'quest-123', status: 'completed' })
    taskUpdateManyMock.mockResolvedValue({ count: 5 })
    transactionMock.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    )

    const result = await questPatchHandler({} as unknown)

    expect(questUpdateMock).toHaveBeenCalledWith({
      where: { id: 'quest-123' },
      data: { status: 'completed' },
    })
    expect(taskUpdateManyMock).toHaveBeenCalledWith({
      where: { questId: 'quest-123' },
      data: { status: 'completed' },
    })
    expect(result).toEqual({ id: 'quest-123', status: 'completed' })
  })

  it('rejects invalid quest statuses', async () => {
    requireUserSessionMock.mockResolvedValue({ user: { id: 'owner-1' } })
    getRouterParamMock.mockReturnValue('quest-123')
    readBodyMock.mockResolvedValue({ status: 'archived' })
    questFindUniqueMock.mockResolvedValue({ ownerId: 'owner-1' })

    await expect(questPatchHandler({} as unknown)).rejects.toThrow('Invalid quest status')
  })
})
