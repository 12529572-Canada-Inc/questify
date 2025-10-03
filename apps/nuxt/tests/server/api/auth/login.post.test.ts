import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils'
import { startTestServer, stopTestServer } from '~/tests/utils/testServer'

describe('Auth Login API', () => {
  beforeAll(async () => {
    await startTestServer()
  }, 60_000)

  afterAll(async () => {
    await stopTestServer()
  })

  it('logs in an existing user', async () => {
    const email = `login-${Date.now()}@example.com`

    // Create user first
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password: 'password123', name: 'Login Test' },
    })

    // Try login
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password: 'password123' },
    })

    expect(res).toHaveProperty('success')
  })
})
