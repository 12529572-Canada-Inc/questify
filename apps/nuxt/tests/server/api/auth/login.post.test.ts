import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Auth Login API', async () => {
  await setup({
    // test context options
  })

  it('logs in an existing user', async () => {
    const email = `login-${Date.now()}@example.com`

    // First create a user
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password: 'password123', name: 'Login Test' },
    })

    // Then attempt login
    const res: {
      success: boolean
      user: { email: string, [key: string]: unknown }
    } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password: 'password123' },
    })

    expect(res).toHaveProperty('success', true)
    expect(res).toHaveProperty('user')
    expect(res.user).toHaveProperty('email', email)
  })
})
