import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestStatus } from '@prisma/client'
import handler from '../../server/api/quests/[id]/archive.patch'

type ErrorPayload = {
  status?: number
  statusCode?: number
  statusText?: string
}

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>
type GetRouterParamMock = (event: unknown, name: string) => string
type CreateErrorMock = (input: ErrorPayload) => Error

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
  getRouterParam?: GetRouterParamMock
  createError?: CreateErrorMock
}

const prismaMocks = vi.hoisted(() => ({
  questFindUnique: vi.fn(),
  questUpdate: vi.fn(),
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
  },
  QuestStatus: questStatusMock,
}))

const recordAuditLog = vi.hoisted(() => vi.fn())
vi.mock('../../server/utils/audit', () => ({
  recordAuditLog,
}))

const globalWithMocks = globalThis as GlobalWithMocks
const originalRequireUserSession = globalWithMocks.requireUserSession
const originalGetRouterParam = globalWithMocks.getRouterParam
const originalCreateError = globalWithMocks.createError

beforeEach(() => {
  prismaMocks.questFindUnique.mockReset()
  prismaMocks.questUpdate.mockReset()
  recordAuditLog.mockReset()

  prismaMocks.questFindUnique.mockResolvedValue({
    ownerId: 'user-1',
    deletedAt: null,
    status: QuestStatus.active,
  })
  prismaMocks.questUpdate.mockResolvedValue({
    id: 'quest-1',
    status: QuestStatus.archived,
  })

  Reflect.set(globalWithMocks, 'requireUserSession', vi.fn(async () => ({ user: { id: 'user-1' } })))
  Reflect.set(globalWithMocks, 'getRouterParam', vi.fn(() => 'quest-1'))
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

  if (originalCreateError) Reflect.set(globalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalWithMocks, 'createError')
})

describe('API /api/quests/[id]/archive (PATCH)', () => {
  it('archives a quest owned by the current user', async () => {
    const result = await handler({} as never)

    expect(prismaMocks.questUpdate).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: { status: QuestStatus.archived },
    })
    expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'quest.archive',
      targetId: 'quest-1',
    }))
    expect(result).toEqual({ id: 'quest-1', status: QuestStatus.archived })
  })

  it('short-circuits when the quest is already archived', async () => {
    prismaMocks.questFindUnique.mockResolvedValueOnce({
      ownerId: 'user-1',
      deletedAt: null,
      status: QuestStatus.archived,
    }).mockResolvedValueOnce({
      id: 'quest-1',
      status: QuestStatus.archived,
    })

    const result = await handler({} as never)

    expect(prismaMocks.questUpdate).not.toHaveBeenCalled()
    expect(result).toEqual({ id: 'quest-1', status: QuestStatus.archived })
  })

  it('rejects when the quest does not exist, is deleted, or belongs to another user', async () => {
    prismaMocks.questFindUnique.mockResolvedValueOnce(null)
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })

    prismaMocks.questFindUnique.mockResolvedValueOnce({
      ownerId: 'someone-else',
      deletedAt: null,
      status: QuestStatus.active,
    })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 403 })

    prismaMocks.questFindUnique.mockResolvedValueOnce({
      ownerId: 'user-1',
      deletedAt: new Date(),
      status: QuestStatus.active,
    })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('requires a quest id parameter', async () => {
    Reflect.set(globalWithMocks, 'getRouterParam', vi.fn(() => ''))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
