import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultAiModels } from 'shared/ai-models'
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
  useRuntimeConfig?: () => { aiModels?: typeof defaultAiModels, aiModelDefaultId?: string }
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
const originalUseRuntimeConfig = (globalThis as GlobalWithMocks).useRuntimeConfig

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
    isPublic: false,
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

  Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
    aiModels: defaultAiModels,
    aiModelDefaultId: 'gpt-4o-mini',
  })))
})

afterEach(() => {
  if (originalRequireUserSession) Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', originalRequireUserSession)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'requireUserSession')

  if (originalReadBody) Reflect.set(globalThis as GlobalWithMocks, 'readBody', originalReadBody)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'readBody')

  if (originalCreateError) Reflect.set(globalThis as GlobalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'createError')

  if (originalUseRuntimeConfig) Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', originalUseRuntimeConfig)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'useRuntimeConfig')
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
        modelType: 'gpt-4o-mini',
        isPublic: false,
      },
    })
    expect(queueAddMock).toHaveBeenCalledWith('decompose', {
      questId: 'quest-1',
      title: 'Launch Quest',
      goal: 'Ship feature',
      context: null,
      constraints: null,
      modelType: 'gpt-4o-mini',
      images: [],
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
        isPublic: false,
      },
    })
  })

  it('creates a public quest when isPublic is true', async () => {
    prismaMocks.questCreate.mockResolvedValueOnce({
      id: 'quest-2',
      title: 'Public Quest',
      goal: null,
      context: null,
      constraints: null,
      ownerId: 'user-1',
      isPublic: true,
    })

    ;(globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({
      title: 'Public Quest',
      isPublic: true,
    }))

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
        title: 'Public Quest',
        goal: null,
        context: null,
        constraints: null,
        ownerId: 'user-1',
        modelType: 'gpt-4o-mini',
        isPublic: true,
      },
    })

    expect(response.quest.isPublic).toBe(true)
  })

  it('rejects non-boolean isPublic values', async () => {
    ;(globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({
      title: 'Test Quest',
      isPublic: 'yes',
    }))

    await expect(handler({ context: { questQueue: { add: queueAddMock } } } as never))
      .rejects.toMatchObject({ statusCode: 400 })
    expect(prismaMocks.questCreate).not.toHaveBeenCalled()
    expect(queueAddMock).not.toHaveBeenCalled()
  })

  it('rejects quests without a valid title', async () => {
    (globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({ title: '   ' }))

    await expect(handler({ context: { questQueue: { add: queueAddMock } } } as never))
      .rejects.toMatchObject({ statusCode: 400 })
    expect(prismaMocks.questCreate).not.toHaveBeenCalled()
    expect(queueAddMock).not.toHaveBeenCalled()
  })
})
