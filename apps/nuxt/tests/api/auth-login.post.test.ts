import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/auth/login.post'

type ErrorPayload = {
  status?: number
  statusCode?: number
  statusText?: string
}

type ReadBodyMock = (event: unknown) => Promise<unknown>
type CreateErrorMock = (input: ErrorPayload) => Error
type SetUserSessionMock = (event: unknown, data: unknown) => Promise<void>

type GlobalWithMocks = typeof globalThis & {
  readBody?: ReadBodyMock
  createError?: CreateErrorMock
  setUserSession?: SetUserSessionMock
}

const prismaMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
}))

const sharedMocks = vi.hoisted(() => ({
  verifyPassword: vi.fn(),
}))

const accessControlMocks = vi.hoisted(() => ({
  attachSessionWithAccess: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = {
      findUnique: prismaMocks.userFindUnique,
    }
  },
}))

vi.mock('shared', () => ({
  verifyPassword: sharedMocks.verifyPassword,
}))

vi.mock('../../server/utils/access-control', () => ({
  attachSessionWithAccess: accessControlMocks.attachSessionWithAccess,
}))

const globalWithMocks = globalThis as GlobalWithMocks

const originalReadBody = globalWithMocks.readBody
const originalCreateError = globalWithMocks.createError
const originalSetUserSession = globalWithMocks.setUserSession

beforeEach(() => {
  prismaMocks.userFindUnique.mockReset()
  sharedMocks.verifyPassword.mockReset()
  accessControlMocks.attachSessionWithAccess.mockReset()

  prismaMocks.userFindUnique.mockResolvedValue({
    id: 'user-1',
    email: 'person@example.com',
    name: 'Person Example',
    password: 'hashed',
  })
  sharedMocks.verifyPassword.mockReturnValue(true)
  accessControlMocks.attachSessionWithAccess.mockResolvedValue({
    roles: ['Admin'],
    privileges: ['user:read'],
  })

  Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({
    email: 'person@example.com',
    password: 'password123',
  })))
  Reflect.set(globalWithMocks, 'createError', ({ status, statusCode, statusText }) => {
    const error = new Error(statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = status ?? statusCode ?? 500
    return error
  })
  Reflect.set(globalWithMocks, 'setUserSession', vi.fn(async () => {}))
})

afterEach(() => {
  if (originalReadBody) Reflect.set(globalWithMocks, 'readBody', originalReadBody)
  else Reflect.deleteProperty(globalWithMocks, 'readBody')

  if (originalCreateError) Reflect.set(globalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalWithMocks, 'createError')

  if (originalSetUserSession) Reflect.set(globalWithMocks, 'setUserSession', originalSetUserSession)
  else Reflect.deleteProperty(globalWithMocks, 'setUserSession')
})

describe('API /api/auth/login (POST)', () => {
  it('verifies credentials and sets the user session', async () => {
  const response = await handler({} as never)

  expect(prismaMocks.userFindUnique).toHaveBeenCalledWith({ where: { email: 'person@example.com' } })
  expect(sharedMocks.verifyPassword).toHaveBeenCalledWith('password123', 'hashed')
  expect(accessControlMocks.attachSessionWithAccess).toHaveBeenCalledWith(expect.anything(), {
    id: 'user-1',
    email: 'person@example.com',
    name: 'Person Example',
  })
  expect(response).toEqual({
    success: true,
    user: {
      id: 'user-1',
      email: 'person@example.com',
      name: 'Person Example',
      roles: ['Admin'],
      privileges: ['user:read'],
    },
  })
  })

  it('rejects missing users and invalid passwords', async () => {
    prismaMocks.userFindUnique.mockResolvedValueOnce(null)
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 401 })

    prismaMocks.userFindUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'person@example.com',
      name: 'Person Example',
      password: 'hashed',
    })
    sharedMocks.verifyPassword.mockReturnValueOnce(false)

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 401 })
  })
})
