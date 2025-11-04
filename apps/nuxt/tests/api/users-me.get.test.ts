import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/users/me/index.get'

const prismaMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  accountFindMany: vi.fn(),
}))

const accessMocks = vi.hoisted(() => ({
  getUserAccessProfile: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = {
      findUnique: prismaMocks.userFindUnique,
    }

    oAuthAccount = {
      findMany: prismaMocks.accountFindMany,
    }
  },
}))

vi.mock('../../server/utils/access-control', () => ({
  getUserAccessProfile: accessMocks.getUserAccessProfile,
}))

const originalRequireUserSession = (globalThis as typeof globalThis & { requireUserSession?: unknown }).requireUserSession

beforeEach(() => {
  prismaMocks.userFindUnique.mockReset()
  prismaMocks.accountFindMany.mockReset()
  accessMocks.getUserAccessProfile.mockReset()

  prismaMocks.userFindUnique.mockResolvedValue({
    id: 'user-1',
    email: 'member@example.com',
    name: 'Member Example',
    avatarUrl: 'https://example.com/avatar.png',
    themePreference: 'dark',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-02T00:00:00Z'),
  })

  prismaMocks.accountFindMany.mockResolvedValue([{ provider: 'google' }])
  accessMocks.getUserAccessProfile.mockResolvedValue({ roles: ['Admin'], privileges: ['user:read'] })

  vi.stubGlobal('requireUserSession', vi.fn(async () => ({
    user: {
      id: 'user-1',
      providers: undefined,
    },
  })))
})

afterEach(() => {
  if (originalRequireUserSession) {
    Reflect.set(globalThis, 'requireUserSession', originalRequireUserSession)
  }
  else {
    Reflect.deleteProperty(globalThis, 'requireUserSession')
  }
  vi.unstubAllGlobals()
})

describe('API /api/users/me (GET)', () => {
  it('returns the current user profile with providers and access info', async () => {
    const result = await handler({} as never)

    expect(prismaMocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        themePreference: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    expect(prismaMocks.accountFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { provider: true },
    })

    expect(accessMocks.getUserAccessProfile).toHaveBeenCalledWith('user-1')

    expect(result).toMatchObject({
      id: 'user-1',
      email: 'member@example.com',
      name: 'Member Example',
      avatarUrl: 'https://example.com/avatar.png',
      themePreference: 'dark',
      roles: ['Admin'],
      privileges: ['user:read'],
      providers: ['google'],
    })
  })
})
