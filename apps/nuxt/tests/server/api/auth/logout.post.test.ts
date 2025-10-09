import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Auth Logout API', async () => {
  await setup({
    // test context options
  })

  it('logs out a user', async () => {
    // Register & login to get a token
    const email = `logout-${Date.now()}@example.com`
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password: 'password123', name: 'Logout Test' },
    })
    const loginRes: {
      token: string
    } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password: 'password123' },
    })

    // Call logout with token (if your API requires auth header)
    const res: {
      success: boolean
    } = await $fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${loginRes.token}` },
    })

    expect(res).toHaveProperty('success', true)
  })
})
