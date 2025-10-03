import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { createTest } from '@nuxt/test-utils'

let ctx: Awaited<ReturnType<typeof createTest>>

describe('Auth Signup API', () => {
  beforeAll(async () => {
    ctx = await createTest({
      rootDir: process.cwd(), // adjust if your Nuxt app is in a subfolder
      server: true,
    })
  }, 60_000)

  afterAll(async () => {
    await ctx.close?.()
  })

  it('registers a new user', async () => {
    const email = `test-${Date.now()}@example.com`
    const body = { email, password: 'password123', name: 'Test User' }

    const res = await ctx.$fetch('/api/auth/signup', {
      method: 'POST',
      body,
    })

    expect(res).toHaveProperty('success', true)
    // Optionally also check that a user record exists in your database, etc.
  })
})
