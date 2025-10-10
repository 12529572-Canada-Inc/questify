import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PrismaClientMock,
  questFindUniqueMock,
  questUpdateMock,
  resetPrismaMocks,
  taskUpdateManyMock,
  transactionMock,
} from '../test-utils/prisma'

vi.mock('@prisma/client', () => ({
  PrismaClient: PrismaClientMock,
}))

const defineEventHandlerMock = vi.fn((handler: any) => handler)
const requireUserSessionMock = vi.fn()
const getRouterParamMock = vi.fn()
const readBodyMock = vi.fn()
const createErrorMock = vi.fn((input: { statusCode: number; statusMessage?: string }) =>
  Object.assign(new Error(input.statusMessage ?? 'Error'), input),
)

let handler: (event: any) => Promise<any>

describe('PATCH /api/quests/[id]', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', defineEventHandlerMock)
    handler = (await import('~/server/api/quests/[id].patch')).default
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

  it('rejects updates from non-owners', async () => {
    requireUserSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    getRouterParamMock.mockReturnValue('quest-1')
    questFindUniqueMock.mockResolvedValue({ ownerId: 'owner-9' })
    readBodyMock.mockResolvedValue({ status: 'completed' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
    expect(questUpdateMock).not.toHaveBeenCalled()
    expect(taskUpdateManyMock).not.toHaveBeenCalled()
  })

  it('completes the quest and all tasks when the owner requests completion', async () => {
    const updatedQuest = { id: 'quest-42', status: 'completed' }

    requireUserSessionMock.mockResolvedValue({ user: { id: 'owner-1' } })
    getRouterParamMock.mockReturnValue('quest-42')
    questFindUniqueMock.mockResolvedValue({ ownerId: 'owner-1' })
    readBodyMock.mockResolvedValue({ status: 'completed' })
    questUpdateMock.mockResolvedValue(updatedQuest)
    taskUpdateManyMock.mockResolvedValue({ count: 3 })

    const result = await handler({} as any)

    expect(result).toEqual(updatedQuest)
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(taskUpdateManyMock).toHaveBeenCalledWith({
      where: { questId: 'quest-42' },
      data: { status: 'completed' },
    })
  })

  it('updates the quest status without affecting tasks for other statuses', async () => {
    requireUserSessionMock.mockResolvedValue({ user: { id: 'owner-1' } })
    getRouterParamMock.mockReturnValue('quest-77')
    questFindUniqueMock.mockResolvedValue({ ownerId: 'owner-1' })
    readBodyMock.mockResolvedValue({ status: 'in_progress' })
    questUpdateMock.mockResolvedValue({ id: 'quest-77', status: 'in_progress' })

    const result = await handler({} as any)

    expect(result).toEqual({ id: 'quest-77', status: 'in_progress' })
    expect(transactionMock).not.toHaveBeenCalled()
    expect(questUpdateMock).toHaveBeenCalledWith({
      where: { id: 'quest-77' },
      data: { status: 'in_progress' },
    })
  })
})
