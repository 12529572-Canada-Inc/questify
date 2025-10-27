import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest'
import { defaultAiModels } from 'shared/ai-models'
import handler from '../../server/api/tasks/[id]/investigations.post'

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>
type GetRouterParamMock = (event: unknown, name: string) => string
type ReadBodyMock = (event: unknown) => Promise<unknown>
type CreateErrorMock = (input: {
  status?: number
  statusCode?: number
  statusText?: string
}) => Error

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
  getRouterParam?: GetRouterParamMock
  readBody?: ReadBodyMock
  createError?: CreateErrorMock
  useRuntimeConfig?: () => { aiModels?: typeof defaultAiModels, aiModelDefaultId?: string }
}

const prismaMocks = vi.hoisted(() => ({
  taskFindUniqueMock: vi.fn(),
  taskInvestigationCreateMock: vi.fn(),
}))

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
const originalRequireUserSession = (globalThis as GlobalWithMocks).requireUserSession
const originalGetRouterParam = (globalThis as GlobalWithMocks).getRouterParam
const originalReadBody = (globalThis as GlobalWithMocks).readBody
const originalCreateError = (globalThis as GlobalWithMocks).createError
const originalUseRuntimeConfig = (globalThis as GlobalWithMocks).useRuntimeConfig

beforeEach(() => {
  prismaMocks.taskFindUniqueMock.mockReset()
  prismaMocks.taskInvestigationCreateMock.mockReset()
  addMock.mockReset()

  Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', vi.fn(async () => ({
    user: { id: 'user-1' },
  })))

  Reflect.set(globalThis as GlobalWithMocks, 'getRouterParam', vi.fn(() => 'task-1'))
  Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({ prompt: '  Explore risks and opportunities  ' })))
  Reflect.set(globalThis as GlobalWithMocks, 'createError', ({ status, statusCode, statusText }) => {
    const error = new Error(statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = status ?? statusCode ?? 500
    return error
  })

  Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
    aiModels: defaultAiModels,
    aiModelDefaultId: 'gpt-4o-mini',
  })))

  prismaMocks.taskFindUniqueMock.mockResolvedValue({ id: 'task-1', quest: { ownerId: 'user-1', modelType: 'gpt-4o-mini' } })
  prismaMocks.taskInvestigationCreateMock.mockResolvedValue({
    id: 'inv-1',
    status: 'pending',
    prompt: 'Explore risks and opportunities',
  })
})

afterEach(() => {
  if (originalRequireUserSession) Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', originalRequireUserSession)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'requireUserSession')

  if (originalGetRouterParam) Reflect.set(globalThis as GlobalWithMocks, 'getRouterParam', originalGetRouterParam)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'getRouterParam')

  if (originalReadBody) Reflect.set(globalThis as GlobalWithMocks, 'readBody', originalReadBody)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'readBody')

  if (originalCreateError) Reflect.set(globalThis as GlobalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'createError')

  if (originalUseRuntimeConfig) Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', originalUseRuntimeConfig)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'useRuntimeConfig')
})

describe('API /api/tasks/[id]/investigations.post', () => {
  it('creates an investigation record and enqueues a job', async () => {
    const mockEvent = {
      context: {
        taskQueue: {
          add: addMock,
        },
      },
    } as unknown as Parameters<typeof handler>[0]

    const response = await handler(mockEvent)

    expect(prismaMocks.taskFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      select: {
        id: true,
        quest: {
          select: {
            ownerId: true,
            modelType: true,
          },
        },
      },
    })
    expect(prismaMocks.taskInvestigationCreateMock).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        initiatedById: 'user-1',
        prompt: 'Explore risks and opportunities',
        status: 'pending',
        modelType: 'gpt-4o-mini',
      },
    })
    expect(addMock).toHaveBeenCalledWith('investigate-task', {
      investigationId: 'inv-1',
      taskId: 'task-1',
      prompt: 'Explore risks and opportunities',
      modelType: 'gpt-4o-mini',
    })
    expect(response.investigation).toEqual({
      id: 'inv-1',
      status: 'pending',
      prompt: 'Explore risks and opportunities',
    })
  })

  it('rejects investigation context that exceeds the limit', async () => {
    (globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({ prompt: 'a'.repeat(1200) }))

    await expect(async () => handler({} as Parameters<typeof handler>[0])).rejects.toMatchObject({ statusCode: 400 })
    expect(prismaMocks.taskInvestigationCreateMock).not.toHaveBeenCalled()
    expect(addMock).not.toHaveBeenCalled()
  })

  it('warns when the task queue is not available', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const response = await handler({
      context: {},
    } as unknown as Parameters<typeof handler>[0])

    expect(addMock).not.toHaveBeenCalled()
    expect(response.investigation).toEqual({
      id: 'inv-1',
      status: 'pending',
      prompt: 'Explore risks and opportunities',
    })
    expect(warnSpy).toHaveBeenCalledWith('Task queue not configured; investigation will remain pending until processed manually.')
    warnSpy.mockRestore()
  })
})
