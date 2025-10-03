import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { startTestServer, stopTestServer } from '~/tests/utils/testServer'

let $fetch: (path: string, opts?: unknown) => Promise<unknown>

describe('Auth Signup API', () => {
  beforeAll(async () => {
    const ctx = await startTestServer()
    $fetch = ctx.$fetch
  }, 60_000)

  afterAll(async () => {
    await stopTestServer()
  })

  it('registers a new user', async () => {
    const email = `test-${Date.now()}@example.com`

    const res = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password: 'password123', name: 'Test User' },
    })

    expect(res).toHaveProperty('success')
  })
})
