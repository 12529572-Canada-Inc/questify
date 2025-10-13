import request from 'supertest'
import { listen } from 'listhen'
import { createApp } from 'h3'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import nitroApp from '../../.output/server/index.mjs'

let server: ReturnType<typeof listen>, url: string

beforeAll(async () => {
  server = await listen(createApp({ fetch: nitroApp.handle }))
  url = server.url
})

afterAll(async () => {
  await server.close()
})

describe('GET /api/quests', () => {
  it('returns list of quests', async () => {
    const res = await request(url).get('/api/quests')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
