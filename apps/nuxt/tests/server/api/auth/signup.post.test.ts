import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import request from 'supertest'
import type { Server } from 'http'
import { startTestServer, stopTestServer } from '../../utils/testServer'

let server: Server

describe('Auth Signup API', () => {
  beforeAll(async () => {
    server = await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  it('registers a new user', async () => {
    const email = `test-${Date.now()}@example.com`
    const res = await request(server).post('/api/auth/signup').send({
      email,
      password: 'password123',
      name: 'Test User',
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
  })
})
