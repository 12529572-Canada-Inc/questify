import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils'
import { startTestServer, stopTestServer } from '~/tests/utils/testServer'

describe('Auth Logout API', () => {
  beforeAll(async () => {
    await startTestServer()
  }, 60_000)

  afterAll(async () => {
    await stopTestServer()
  })

  it('logs out a user', async () => {
    const res = await $fetch('/api/auth/logout', {
      method: 'POST',
    })

    expect(res).toHaveProperty('success')
  })
})
