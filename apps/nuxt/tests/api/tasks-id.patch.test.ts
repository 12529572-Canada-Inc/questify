import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/tasks/[id].patch'

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
  taskFindUnique: vi.fn(),
  taskUpdate: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    task = {
      findUnique: prismaMocks.taskFindUnique,
      update: prismaMocks.taskUpdate,
    }
  },
}))

const globalWithMocks = globalThis as GlobalWithMocks

const originalRequireUserSession = globalWithMocks.requireUserSession
const originalGetRouterParam = globalWithMocks.getRouterParam
const originalReadBody = globalWithMocks.readBody
const originalCreateError = globalWithMocks.createError

beforeEach(() => {
  prismaMocks.taskFindUnique.mockReset()
  prismaMocks.taskUpdate.mockReset()

  prismaMocks.taskFindUnique.mockResolvedValue({
    id: 'task-1',
    quest: { ownerId: 'user-1' },
  })
  prismaMocks.taskUpdate.mockImplementation(async ({ data }) => ({
    id: 'task-1',
    ...data,
  }))

  Reflect.set(globalWithMocks, 'requireUserSession', vi.fn(async () => ({ user: { id: 'user-1' } })))
  Reflect.set(globalWithMocks, 'getRouterParam', vi.fn(() => 'task-1'))
  Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({
    status: 'in-progress',
    title: '  Build UI  ',
    details: '  Document progress  ',
    extraContent: '',
  })))
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

describe('API /api/tasks/[id] (PATCH)', () => {
  it('updates supported fields with sanitization and validation', async () => {
    const response = await handler({} as never)

    expect(prismaMocks.taskUpdate).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        status: 'in-progress',
        title: 'Build UI',
        details: 'Document progress',
        extraContent: null,
      },
    })
    expect(response).toEqual({
      id: 'task-1',
      status: 'in-progress',
      title: 'Build UI',
      details: 'Document progress',
      extraContent: null,
    })
  })

  it('rejects invalid statuses and invalid titles', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ status: 'invalid' })))
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })

    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({ status: 'todo', title: '   ' })))
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects unsupported optional content types', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({
      status: 'todo',
      extraContent: 42,
    })))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects when no valid fields are provided', async () => {
    Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({})))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects when the task does not exist or belongs to another user', async () => {
    prismaMocks.taskFindUnique.mockResolvedValueOnce(null)
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })

    prismaMocks.taskFindUnique.mockResolvedValueOnce({ quest: { ownerId: 'someone-else' } })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 403 })
  })
})
