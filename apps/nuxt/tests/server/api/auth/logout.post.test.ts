import { describe, it, expect } from 'vitest'
import { clearUserSession } from '#auth-utils/server'

describe('Auth Logout API', () => {
  it('clears the session', async () => {
    const mockEvent = {} as Parameters<typeof clearUserSession>[0] // mock event for testing

    const result = await clearUserSession(mockEvent)
    expect(result).toBeUndefined()
  })
})
