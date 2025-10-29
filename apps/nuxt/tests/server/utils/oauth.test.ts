import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { handleOAuthSuccess } from '../../../server/utils/oauth'

const prismaMocks = vi.hoisted(() => ({
  accountFindUnique: vi.fn(),
  accountUpdate: vi.fn(),
  accountCreate: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
}))

const attachSessionMock = vi.hoisted(() => vi.fn())
const setCookieMock = vi.hoisted(() => vi.fn())
const getUserSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    oAuthAccount = {
      findUnique: prismaMocks.accountFindUnique,
      update: prismaMocks.accountUpdate,
      create: prismaMocks.accountCreate,
    }

    user = {
      findUnique: prismaMocks.userFindUnique,
      create: prismaMocks.userCreate,
      update: prismaMocks.userUpdate,
    }
  },
}))

vi.mock('../../../server/utils/access-control', () => ({
  attachSessionWithAccess: attachSessionMock,
}))

vi.mock('#imports', () => ({
  setCookie: setCookieMock,
}))

type GetUserSessionFn = (event: H3Event) => Promise<{ user?: SessionUser } | null>

const globalWithSession = globalThis as typeof globalThis & { getUserSession?: GetUserSessionFn }
const originalGetUserSession = globalWithSession.getUserSession

describe('handleOAuthSuccess', () => {
  const event = {} as H3Event

  beforeEach(() => {
    prismaMocks.accountFindUnique.mockReset()
    prismaMocks.accountUpdate.mockReset()
    prismaMocks.accountCreate.mockReset()
    prismaMocks.userFindUnique.mockReset()
    prismaMocks.userCreate.mockReset()
    prismaMocks.userUpdate.mockReset()
    attachSessionMock.mockReset()
    setCookieMock.mockReset()
    getUserSessionMock.mockReset()

    getUserSessionMock.mockResolvedValue(null)
    globalWithSession.getUserSession = getUserSessionMock
  })

  afterEach(() => {
    if (originalGetUserSession) {
      globalWithSession.getUserSession = originalGetUserSession
    }
    else {
      delete globalWithSession.getUserSession
    }
  })

  it('creates a new user when no account exists', async () => {
    prismaMocks.accountFindUnique.mockResolvedValue(null)
    prismaMocks.userFindUnique.mockResolvedValue(null)
    prismaMocks.userCreate.mockResolvedValue({
      id: 'user-1',
      email: 'person@example.com',
      name: 'Person Example',
    })

    const result = await handleOAuthSuccess(event, 'google', {
      id: 'google-1',
      email: 'person@example.com',
      name: 'Person Example',
    }, {
      access_token: 'at',
      refresh_token: 'rt',
      expires_in: 3600,
    })

    expect(prismaMocks.userCreate).toHaveBeenCalledWith({
      data: {
        email: 'person@example.com',
        name: 'Person Example',
      },
    })
    expect(prismaMocks.accountCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        provider: 'google',
        providerAccountId: 'google-1',
        userId: 'user-1',
        accessToken: 'at',
        refreshToken: 'rt',
      }),
    }))
    expect(attachSessionMock).toHaveBeenCalledWith(event, expect.objectContaining({ id: 'user-1' }), expect.objectContaining({ includeProviders: true }))
    expect(setCookieMock).toHaveBeenCalledWith(event, 'oauth_result', expect.stringContaining('"action":"created"'), expect.any(Object))
    expect(result).toMatchObject({
      action: 'created',
      provider: 'google',
      user: {
        id: 'user-1',
        email: 'person@example.com',
      },
    })
  })

  it('links provider to existing session user', async () => {
    getUserSessionMock.mockResolvedValue({ user: { id: 'user-42' } })
    prismaMocks.accountFindUnique.mockResolvedValue(null)
    prismaMocks.userFindUnique.mockResolvedValue({
      id: 'user-42',
      email: 'member@example.com',
      name: 'Member',
    })

    const result = await handleOAuthSuccess(event, 'facebook', {
      id: 'fb-1',
      email: 'member@example.com',
      name: 'Member',
    }, {})

    expect(prismaMocks.accountCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        provider: 'facebook',
        providerAccountId: 'fb-1',
        userId: 'user-42',
      }),
    }))
    expect(result.action).toBe('linked')
    expect(setCookieMock).toHaveBeenCalledWith(event, 'oauth_result', expect.stringContaining('"action":"linked"'), expect.any(Object))
  })

  it('reuses an existing OAuth account', async () => {
    prismaMocks.accountFindUnique.mockResolvedValue({
      id: 'acct-1',
      provider: 'google',
      providerAccountId: 'google-1',
      userId: 'user-55',
      user: {
        id: 'user-55',
        email: 'existing@example.com',
        name: 'Existing',
      },
    })

    const result = await handleOAuthSuccess(event, 'google', { id: 'google-1' }, { access_token: 'latest' })

    expect(prismaMocks.accountUpdate).toHaveBeenCalledWith({
      where: { id: 'acct-1' },
      data: expect.objectContaining({ accessToken: 'latest' }),
    })
    expect(result.action).toBe('signed-in')
    expect(setCookieMock).toHaveBeenCalledWith(event, 'oauth_result', expect.stringContaining('"action":"signed-in"'), expect.any(Object))
  })
})
