import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/auth/logout.post'

type ClearUserSessionMock = (event: unknown) => Promise<void>

type GlobalWithMocks = typeof globalThis & {
  clearUserSession?: ClearUserSessionMock
}

const globalWithMocks = globalThis as GlobalWithMocks
const originalClearUserSession = globalWithMocks.clearUserSession

beforeEach(() => {
  Reflect.set(globalWithMocks, 'clearUserSession', vi.fn(async () => {}))
})

afterEach(() => {
  if (originalClearUserSession) Reflect.set(globalWithMocks, 'clearUserSession', originalClearUserSession)
  else Reflect.deleteProperty(globalWithMocks, 'clearUserSession')
})

describe('API /api/auth/logout (POST)', () => {
  it('clears the user session', async () => {
    const response = await handler({} as never)

    expect(globalWithMocks.clearUserSession).toHaveBeenCalled()
    expect(response).toEqual({ success: true })
  })
})
