import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/users/index.get'

const prismaMocks = vi.hoisted(() => ({
  userFindMany: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = {
      findMany: prismaMocks.userFindMany,
    }
  },
}))

beforeEach(() => {
  prismaMocks.userFindMany.mockReset()
  prismaMocks.userFindMany.mockResolvedValue([
    { id: 'user-1', email: 'one@example.com', name: 'One' },
    { id: 'user-2', email: 'two@example.com', name: 'Two' },
  ])

  vi.stubGlobal('requireUserSession', vi.fn(async () => ({
    user: {
      id: 'admin-1',
      privileges: ['user:read'],
      roles: ['Admin'],
    },
  })))
  vi.stubGlobal('setUserSession', vi.fn(async () => {}))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('API /api/users (GET)', () => {
  it('returns basic user profiles', async () => {
    const result = await handler({} as never)

    expect(prismaMocks.userFindMany).toHaveBeenCalledWith({
      select: { id: true, email: true, name: true },
    })
    expect(result).toHaveLength(2)
  })
})
