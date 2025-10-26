import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/quests/[id].get'

type ErrorPayload = {
  status?: number
  statusCode?: number
  statusText?: string
}

type GetRouterParamMock = (event: unknown, name: string) => string
type GetUserSessionMock = (event: unknown) => Promise<{ user?: { id: string } } | null>
type CreateErrorMock = (input: ErrorPayload) => Error

type GlobalWithMocks = typeof globalThis & {
  getRouterParam?: GetRouterParamMock
  getUserSession?: GetUserSessionMock
  createError?: CreateErrorMock
}

const prismaMocks = vi.hoisted(() => ({
  questFindUnique: vi.fn(),
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
    }
  },
  QuestStatus: questStatusMock,
}))

const globalWithMocks = globalThis as GlobalWithMocks

const originalGetRouterParam = globalWithMocks.getRouterParam
const originalGetUserSession = globalWithMocks.getUserSession
const originalCreateError = globalWithMocks.createError

beforeEach(() => {
  prismaMocks.questFindUnique.mockReset()
  prismaMocks.questFindUnique.mockResolvedValue({
    id: 'quest-1',
    ownerId: 'user-1',
    isPublic: false,
    status: 'active',
    deletedAt: null,
    tasks: [],
    owner: { id: 'user-1', email: 'person@example.com', name: 'Person Example' },
  })

  Reflect.set(globalWithMocks, 'getRouterParam', vi.fn(() => 'quest-1'))
  Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => ({ user: { id: 'user-1' } })))
  Reflect.set(globalWithMocks, 'createError', ({ status, statusCode, statusText }) => {
    const error = new Error(statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = status ?? statusCode ?? 500
    return error
  })
})

afterEach(() => {
  if (originalGetRouterParam) Reflect.set(globalWithMocks, 'getRouterParam', originalGetRouterParam)
  else Reflect.deleteProperty(globalWithMocks, 'getRouterParam')

  if (originalGetUserSession) Reflect.set(globalWithMocks, 'getUserSession', originalGetUserSession)
  else Reflect.deleteProperty(globalWithMocks, 'getUserSession')

  if (originalCreateError) Reflect.set(globalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalWithMocks, 'createError')
})

describe('API /api/quests/[id] (GET)', () => {
  it('returns the quest when the requester is the owner', async () => {
    const quest = await handler({} as never)

    expect(quest).toMatchObject({ id: 'quest-1', ownerId: 'user-1' })
    expect(prismaMocks.questFindUnique).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            investigations: {
              orderBy: { createdAt: 'desc' },
              include: {
                initiatedBy: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  })

  it('rejects requests when the quest does not exist or cannot be viewed', async () => {
    prismaMocks.questFindUnique.mockResolvedValueOnce(null)
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })

    prismaMocks.questFindUnique.mockResolvedValueOnce({
      id: 'quest-1',
      ownerId: 'owner-2',
      isPublic: false,
      status: 'active',
      deletedAt: null,
    })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 403 })

    prismaMocks.questFindUnique.mockResolvedValueOnce({
      id: 'quest-1',
      ownerId: 'user-1',
      isPublic: false,
      status: 'active',
      deletedAt: new Date(),
    })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('requires a quest id parameter', async () => {
    Reflect.set(globalWithMocks, 'getRouterParam', vi.fn(() => ''))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
