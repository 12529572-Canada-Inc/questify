import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { createTest } from '@nuxt/test-utils'

let ctx: Awaited<ReturnType<typeof createTest>>

describe('Auth Login API', () => {
  beforeAll(async () => {
    ctx = await createTest({
      rootDir: process.cwd(), // adjust if needed (e.g. resolve to apps/nuxt)
      server: true,
    })
  }, 60_000)

  afterAll(async () => {
    await ctx.close?.()
  })

  it('logs in an existing user', async () => {
    const email = `login-${Date.now()}@example.com`

    // First create a user
    await ctx.$fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password: 'password123', name: 'Login Test' },
    })

    // Then attempt login
    const res = await ctx.$fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password: 'password123' },
    })

    expect(res).toHaveProperty('success', true)
    expect(res).toHaveProperty('token')
  })
})
