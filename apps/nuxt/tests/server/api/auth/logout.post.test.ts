import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import request from 'supertest'
import type { Server } from 'http'
import { startTestServer, stopTestServer } from '../../utils/testServer'

let server: Server

describe('Auth Logout API', () => {
  beforeAll(async () => {
    server = await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  it('logs out a user', async () => {
    const res = await request(server).post('/api/auth/logout')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
  })
})
