import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import request from 'supertest'
import type { Server } from 'http'
import { startTestServer, stopTestServer } from '../../utils/testServer'

let server: Server

describe('Auth Login API', () => {
  beforeAll(async () => {
    server = await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  it('logs in an existing user', async () => {
    const email = `login-${Date.now()}@example.com`

    // First, sign up
    await request(server).post('/api/auth/signup').send({
      email,
      password: 'password123',
      name: 'Login Test',
    })

    // Then, log in
    const res = await request(server).post('/api/auth/login').send({
      email,
      password: 'password123',
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })
})
