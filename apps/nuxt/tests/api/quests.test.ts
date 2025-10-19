import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/quests/index.get'

type GetUserSessionMock = (event: unknown) => Promise<{ user?: { id: string } } | null>

type GlobalWithMocks = typeof globalThis & {
  getUserSession?: GetUserSessionMock
}

const prismaMocks = vi.hoisted(() => ({
  questFindMany: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    quest = {
      findMany: prismaMocks.questFindMany,
    }
  },
}))

const globalWithMocks = globalThis as GlobalWithMocks
const originalGetUserSession = globalWithMocks.getUserSession

beforeEach(() => {
  prismaMocks.questFindMany.mockReset()
  prismaMocks.questFindMany.mockResolvedValue([
    { id: 'quest-1', title: 'Quest Alpha', status: 'active' },
  ])

  Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => null))
})

afterEach(() => {
  if (originalGetUserSession) Reflect.set(globalWithMocks, 'getUserSession', originalGetUserSession)
  else Reflect.deleteProperty(globalWithMocks, 'getUserSession')
})

describe('API /api/quests (GET)', () => {
  it('only returns public quests to anonymous users', async () => {
    await expect(handler({} as never)).resolves.toEqual([
      { id: 'quest-1', title: 'Quest Alpha', status: 'active' },
    ])
    expect(prismaMocks.questFindMany).toHaveBeenCalledWith({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('returns both owned and public quests to authenticated users', async () => {
    Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => ({ user: { id: 'user-1' } })))

    await handler({} as never)

    expect(prismaMocks.questFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ownerId: 'user-1' },
          { isPublic: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })
  })
})
