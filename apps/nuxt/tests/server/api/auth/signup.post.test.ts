import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Auth Signup API', async () => {
  await setup({
    // test context options
  })

  it('registers a new user', async () => {
    const email = `test-${Date.now()}@example.com`
    const body = { email, password: 'password123', name: 'Test User' }

    const res = await $fetch('/api/auth/signup', {
      method: 'POST',
      body,
    })

    expect(res).toHaveProperty('success', true)
    // Optionally also check that a user record exists in your database, etc.
  })
})
