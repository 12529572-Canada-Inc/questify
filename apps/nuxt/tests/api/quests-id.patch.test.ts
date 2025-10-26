import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestStatus } from '@prisma/client'
import handler from '../../server/api/quests/[id].patch'

type ErrorPayload = {
  status?: number
  statusCode?: number
  statusText?: string
}

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>
type GetRouterParamMock = (event: unknown, name: string) => string
type ReadBodyMock = (event: unknown) => Promise<unknown>
type CreateErrorMock = (input: ErrorPayload) => Error

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
  getRouterParam?: GetRouterParamMock
  readBody?: ReadBodyMock
  createError?: CreateErrorMock
}

const prismaMocks = vi.hoisted(() => ({
  questFindUnique: vi.fn(),
  questUpdate: vi.fn(),
  taskUpdateMany: vi.fn(),
  transaction: vi.fn(),
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
      findUnique: prismaMocks.questFindUnique,
      update: prismaMocks.questUpdate,
    }

    task = {
      updateMany: prismaMocks.taskUpdateMany,
    }

    $transaction = prismaMocks.transaction
  },
  QuestStatus: questStatusMock,
}))

const globalWithMocks = globalThis as GlobalWithMocks

const originalRequireUserSession = globalWithMocks.requireUserSession
const originalGetRouterParam = globalWithMocks.getRouterParam
const originalReadBody = globalWithMocks.readBody
const originalCreateError = globalWithMocks.createError

beforeEach(() => {
  prismaMocks.questFindUnique.mockReset()
  prismaMocks.questUpdate.mockReset()
  prismaMocks.taskUpdateMany.mockReset()
  prismaMocks.transaction.mockReset()

  prismaMocks.questFindUnique.mockResolvedValue({ ownerId: 'user-1', deletedAt: null })
  prismaMocks.questUpdate.mockImplementation(async ({ data }) => ({ id: 'quest-1', status: data.status }))
  prismaMocks.taskUpdateMany.mockResolvedValue({ count: 2 })
  prismaMocks.transaction.mockImplementation(async (operations: unknown[]) => Promise.all(operations as Promise<unknown>[]))

  Reflect.set(globalWithMocks, 'requireUserSession', vi.fn(async () => ({ user: { id: 'user-1' } })))
  Reflect.set(globalWithMocks, 'getRouterParam', vi.fn(() => 'quest-1'))
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ status: QuestStatus.completed })))
  Reflect.set(globalWithMocks, 'createError', ({ status, statusCode, statusText }) => {
    const error = new Error(statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = status ?? statusCode ?? 500
    return error
  })
})

afterEach(() => {
  if (originalRequireUserSession) Reflect.set(globalWithMocks, 'requireUserSession', originalRequireUserSession)
  else Reflect.deleteProperty(globalWithMocks, 'requireUserSession')

  if (originalGetRouterParam) Reflect.set(globalWithMocks, 'getRouterParam', originalGetRouterParam)
  else Reflect.deleteProperty(globalWithMocks, 'getRouterParam')

  if (originalReadBody) Reflect.set(globalWithMocks, 'readBody', originalReadBody)
  else Reflect.deleteProperty(globalWithMocks, 'readBody')

  if (originalCreateError) Reflect.set(globalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalWithMocks, 'createError')
})

describe('API /api/quests/[id] (PATCH)', () => {
  it('completes a quest and associated tasks', async () => {
    const result = await handler({} as never)

    expect(prismaMocks.transaction).toHaveBeenCalledTimes(1)
    expect(prismaMocks.questUpdate).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: { status: QuestStatus.completed },
    })
    expect(prismaMocks.taskUpdateMany).toHaveBeenCalledWith({
      where: { questId: 'quest-1' },
      data: { status: 'completed' },
    })
    expect(result).toEqual({ id: 'quest-1', status: QuestStatus.completed })
  })

  it('moves completed tasks back to todo when quest reopens', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ status: QuestStatus.draft })))

    const result = await handler({} as never)

    expect(prismaMocks.questUpdate).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: { status: QuestStatus.draft },
    })
    expect(prismaMocks.taskUpdateMany).toHaveBeenCalledWith({
      where: { questId: 'quest-1', status: 'completed' },
      data: { status: 'todo' },
    })
    expect(result).toEqual({ id: 'quest-1', status: QuestStatus.draft })
  })

  it('updates quest with other valid statuses using fallback path', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ status: QuestStatus.failed })))

    const result = await handler({} as never)

    expect(prismaMocks.transaction).not.toHaveBeenCalled()
    expect(prismaMocks.questUpdate).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: { status: QuestStatus.failed },
    })
    expect(result).toEqual({ id: 'quest-1', status: QuestStatus.failed })
  })

  it('rejects requests with invalid status values', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ status: 'invalid-status' })))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects when quest is missing or belongs to a different user', async () => {
    prismaMocks.questFindUnique.mockResolvedValueOnce(null)
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })

    prismaMocks.questFindUnique.mockResolvedValueOnce({ ownerId: 'someone-else', deletedAt: null })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 403 })

    prismaMocks.questFindUnique.mockResolvedValueOnce({ ownerId: 'user-1', deletedAt: new Date() })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('updates quest visibility when isPublic is provided', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ isPublic: true })))
    prismaMocks.questUpdate.mockImplementation(async ({ data }) => ({ id: 'quest-1', isPublic: data.isPublic }))

    const result = await handler({} as never)

    expect(prismaMocks.questUpdate).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: { isPublic: true },
    })
    expect(result).toEqual({ id: 'quest-1', isPublic: true })
  })

  it('updates both status and visibility when both are provided', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ status: QuestStatus.active, isPublic: true })))
    prismaMocks.questUpdate.mockImplementation(async ({ data }) => ({
      id: 'quest-1',
      status: data.status,
      isPublic: data.isPublic,
    }))

    await handler({} as never)

    expect(prismaMocks.questUpdate).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: { status: QuestStatus.active, isPublic: true },
    })
  })

  it('rejects when isPublic is not a boolean', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ isPublic: 'invalid' })))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects when neither status nor isPublic is provided', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({})))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
