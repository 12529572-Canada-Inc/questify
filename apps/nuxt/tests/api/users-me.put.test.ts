import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/users/me/index.put'

const prismaMocks = vi.hoisted(() => ({
  userUpdate: vi.fn(),
  userFindUnique: vi.fn(),
  accountFindMany: vi.fn(),
}))

const accessMocks = vi.hoisted(() => ({
  attachSessionWithAccess: vi.fn(),
  getUserAccessProfile: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = {
      update: prismaMocks.userUpdate,
      findUnique: prismaMocks.userFindUnique,
    }

    oAuthAccount = {
      findMany: prismaMocks.accountFindMany,
    }
  },
}))

vi.mock('../../server/utils/access-control', () => ({
  attachSessionWithAccess: accessMocks.attachSessionWithAccess,
  getUserAccessProfile: accessMocks.getUserAccessProfile,
}))

const originalRequireUserSession = (globalThis as typeof globalThis & { requireUserSession?: unknown }).requireUserSession
const originalReadBody = (globalThis as typeof globalThis & { readBody?: unknown }).readBody
const originalCreateError = (globalThis as typeof globalThis & { createError?: unknown }).createError

beforeEach(() => {
  prismaMocks.userUpdate.mockReset()
  prismaMocks.userFindUnique.mockReset()
  prismaMocks.accountFindMany.mockReset()
  accessMocks.attachSessionWithAccess.mockReset()
  accessMocks.getUserAccessProfile.mockReset()

  prismaMocks.userUpdate.mockResolvedValue({
    id: 'user-1',
    email: 'member@example.com',
    name: 'Updated Name',
    avatarUrl: 'https://example.com/avatar.png',
    themePreference: 'auto',
  })

  accessMocks.attachSessionWithAccess.mockResolvedValue({
    roles: ['Admin'],
    privileges: ['user:update'],
    providers: ['google'],
    avatarUrl: 'https://example.com/avatar.png',
    themePreference: 'auto',
  })

  accessMocks.getUserAccessProfile.mockResolvedValue({ roles: ['Admin'], privileges: ['user:update'] })

  prismaMocks.userFindUnique.mockResolvedValue({
    id: 'user-1',
    email: 'member@example.com',
    name: 'Member Example',
    avatarUrl: 'https://example.com/avatar.png',
    themePreference: 'dark',
  })

  prismaMocks.accountFindMany.mockResolvedValue([{ provider: 'google' }])

  vi.stubGlobal('requireUserSession', vi.fn(async () => ({ user: { id: 'user-1' } })))
  vi.stubGlobal('readBody', vi.fn(async () => ({
    name: 'Updated Name',
    themePreference: 'auto',
    avatarUrl: 'https://example.com/avatar.png',
  })))
  vi.stubGlobal('createError', ({ status, statusText }: { status?: number, statusText?: string }) => {
    const error = new Error(statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = status ?? 500
    return error
  })
})

afterEach(() => {
  if (originalRequireUserSession) {
    Reflect.set(globalThis, 'requireUserSession', originalRequireUserSession)
  }
  else {
    Reflect.deleteProperty(globalThis, 'requireUserSession')
  }

  if (originalReadBody) {
    Reflect.set(globalThis, 'readBody', originalReadBody)
  }
  else {
    Reflect.deleteProperty(globalThis, 'readBody')
  }

  if (originalCreateError) {
    Reflect.set(globalThis, 'createError', originalCreateError)
  }
  else {
    Reflect.deleteProperty(globalThis, 'createError')
  }
  vi.unstubAllGlobals()
})

describe('API /api/users/me (PUT)', () => {
  it('updates profile fields and refreshes session', async () => {
    const result = await handler({} as never)

    expect(prismaMocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.png',
        themePreference: 'auto',
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        themePreference: true,
      },
    })

    expect(accessMocks.attachSessionWithAccess).toHaveBeenCalledWith(expect.anything(), {
      id: 'user-1',
      email: 'member@example.com',
      name: 'Updated Name',
      avatarUrl: 'https://example.com/avatar.png',
      themePreference: 'auto',
    }, { includeProviders: true })

    expect(result).toMatchObject({
      success: true,
      user: {
        id: 'user-1',
        email: 'member@example.com',
        name: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.png',
        themePreference: 'auto',
        providers: ['google'],
      },
    })
  })
})
