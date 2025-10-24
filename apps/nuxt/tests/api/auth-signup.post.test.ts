import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/auth/signup.post'

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
  userCreate: vi.fn(),
}))

const sharedMocks = vi.hoisted(() => ({
  hashPassword: vi.fn(),
}))

const accessControlMocks = vi.hoisted(() => ({
  ensureSuperAdmin: vi.fn(),
  attachSessionWithAccess: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = {
      findUnique: prismaMocks.userFindUnique,
      create: prismaMocks.userCreate,
    }
  },
}))

vi.mock('shared/server', () => ({
  hashPassword: sharedMocks.hashPassword,
}))

vi.mock('#prisma-utils/accessControl', () => ({
  ensureSuperAdmin: accessControlMocks.ensureSuperAdmin,
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
  prismaMocks.userCreate.mockReset()
  sharedMocks.hashPassword.mockReset()
  accessControlMocks.ensureSuperAdmin.mockReset()
  accessControlMocks.attachSessionWithAccess.mockReset()

  prismaMocks.userFindUnique.mockResolvedValue(null)
  prismaMocks.userCreate.mockResolvedValue({
    id: 'user-1',
    email: 'new@example.com',
    name: 'New User',
  })
  sharedMocks.hashPassword.mockReturnValue('hashed-password')
  accessControlMocks.ensureSuperAdmin.mockResolvedValue(undefined)
  accessControlMocks.attachSessionWithAccess.mockResolvedValue({
    roles: ['SuperAdmin'],
    privileges: ['user:read'],
  })

  Reflect.set(globalWithMocks, 'readBody', vi.fn(async () => ({
    email: 'new@example.com',
    password: 'password123',
    name: 'New User',
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

describe('API /api/auth/signup (POST)', () => {
  it('hashes the password, creates the user, and sets a session', async () => {
    const response = await handler({} as never)

    expect(prismaMocks.userFindUnique).toHaveBeenCalledWith({ where: { email: 'new@example.com' } })
    expect(sharedMocks.hashPassword).toHaveBeenCalledWith('password123')
    expect(prismaMocks.userCreate).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        password: 'hashed-password',
        name: 'New User',
      },
    })
    expect(accessControlMocks.ensureSuperAdmin).toHaveBeenCalledWith(expect.anything())
    expect(accessControlMocks.attachSessionWithAccess).toHaveBeenCalledWith(expect.anything(), {
      id: 'user-1',
      email: 'new@example.com',
      name: 'New User',
    })
    expect(response).toEqual({
      success: true,
      user: {
        id: 'user-1',
        email: 'new@example.com',
        name: 'New User',
        roles: ['SuperAdmin'],
        privileges: ['user:read'],
      },
    })
  })

  it('rejects when a user with the same email already exists', async () => {
    prismaMocks.userFindUnique.mockResolvedValueOnce({ id: 'existing-user' })

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 409 })
    expect(prismaMocks.userCreate).not.toHaveBeenCalled()
  })
})
