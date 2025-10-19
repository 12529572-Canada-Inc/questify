import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/auth/session.get'

type GetUserSessionMock = (event: unknown) => Promise<{ user?: { id: string } } | null>

type GlobalWithMocks = typeof globalThis & {
  getUserSession?: GetUserSessionMock
}

const globalWithMocks = globalThis as GlobalWithMocks
const originalGetUserSession = globalWithMocks.getUserSession

beforeEach(() => {
  Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => ({
    user: { id: 'user-1' },
  })))
})

afterEach(() => {
  if (originalGetUserSession) Reflect.set(globalWithMocks, 'getUserSession', originalGetUserSession)
  else Reflect.deleteProperty(globalWithMocks, 'getUserSession')
})

describe('API /api/auth/session (GET)', () => {
  it('returns the current user when the session exists', async () => {
    await expect(handler({} as never)).resolves.toEqual({ id: 'user-1' })
  })

  it('returns null when there is no active session', async () => {
    Reflect.set(globalWithMocks, 'getUserSession', vi.fn(async () => null))

    await expect(handler({} as never)).resolves.toBeNull()
  })
})
