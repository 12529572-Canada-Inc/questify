import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { createTest } from '@nuxt/test-utils'

let ctx: Awaited<ReturnType<typeof createTest>>

describe('Auth Logout API', () => {
  beforeAll(async () => {
    ctx = await createTest({
      rootDir: process.cwd(), // adjust if needed
      server: true,
    })
  }, 60_000)

  afterAll(async () => {
    await ctx.close?.()
  })

  it('logs out a user', async () => {
    // Register & login to get a token
    const email = `logout-${Date.now()}@example.com`
    await ctx.$fetch('/api/auth/signup', {
      method: 'POST',
      body: { email, password: 'password123', name: 'Logout Test' },
    })
    const loginRes = await ctx.$fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password: 'password123' },
    })

    // Call logout with token (if your API requires auth header)
    const res = await ctx.$fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${loginRes.token}` },
    })

    expect(res).toHaveProperty('success', true)
  })
})
