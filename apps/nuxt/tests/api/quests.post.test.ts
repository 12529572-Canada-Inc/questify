import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/quests/index.post'

type ErrorPayload = {
  status?: number
  statusCode?: number
  statusText?: string
}

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>
type ReadBodyMock = (event: unknown) => Promise<unknown>
type CreateErrorMock = (input: ErrorPayload) => Error

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
  readBody?: ReadBodyMock
  createError?: CreateErrorMock
}

const prismaMocks = vi.hoisted(() => ({
  questCreate: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    quest = {
      create: prismaMocks.questCreate,
    }
  },
}))

const queueAddMock = vi.fn()
const originalRequireUserSession = (globalThis as GlobalWithMocks).requireUserSession
const originalReadBody = (globalThis as GlobalWithMocks).readBody
const originalCreateError = (globalThis as GlobalWithMocks).createError

beforeEach(() => {
  prismaMocks.questCreate.mockReset()
  queueAddMock.mockReset()

  prismaMocks.questCreate.mockResolvedValue({
    id: 'quest-1',
    title: 'Launch Quest',
    goal: 'Ship feature',
    context: 'Build quickly',
    constraints: null,
    ownerId: 'user-1',
  })

  Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', vi.fn(async () => ({
    user: { id: 'user-1' },
  })))

  Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({
    title: '  Launch Quest  ',
    goal: '  Ship feature ',
    context: '   ',
    constraints: '',
  })))

  Reflect.set(globalThis as GlobalWithMocks, 'createError', ({ status, statusCode, statusText }) => {
    const error = new Error(statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = status ?? statusCode ?? 500
    return error
  })
})

afterEach(() => {
  if (originalRequireUserSession) Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', originalRequireUserSession)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'requireUserSession')

  if (originalReadBody) Reflect.set(globalThis as GlobalWithMocks, 'readBody', originalReadBody)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'readBody')

  if (originalCreateError) Reflect.set(globalThis as GlobalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'createError')
})

describe('API /api/quests (POST)', () => {
  it('creates a quest and enqueues decomposition job with sanitized fields', async () => {
    const event = {
      context: {
        questQueue: {
          add: queueAddMock.mockResolvedValue(undefined),
        },
      },
    } as unknown as Parameters<typeof handler>[0]

    const response = await handler(event)

    expect(prismaMocks.questCreate).toHaveBeenCalledWith({
      data: {
        title: 'Launch Quest',
        goal: 'Ship feature',
        context: null,
        constraints: null,
        ownerId: 'user-1',
      },
    })
    expect(queueAddMock).toHaveBeenCalledWith('decompose', {
      questId: 'quest-1',
      title: 'Launch Quest',
      goal: 'Ship feature',
      context: null,
      constraints: null,
    })
    expect(response).toEqual({
      success: true,
      quest: {
        id: 'quest-1',
        title: 'Launch Quest',
        goal: 'Ship feature',
        context: 'Build quickly',
        constraints: null,
        ownerId: 'user-1',
      },
    })
  })

  it('rejects quests without a valid title', async () => {
    (globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({ title: '   ' }))

    await expect(handler({ context: { questQueue: { add: queueAddMock } } } as never))
      .rejects.toMatchObject({ statusCode: 400 })
    expect(prismaMocks.questCreate).not.toHaveBeenCalled()
    expect(queueAddMock).not.toHaveBeenCalled()
  })
})
