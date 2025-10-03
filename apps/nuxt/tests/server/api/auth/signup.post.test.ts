import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils'
import { startTestServer, stopTestServer } from '~/tests/utils/testServer'

describe('Auth Signup API', () => {
  beforeAll(async () => {
    await startTestServer()
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
