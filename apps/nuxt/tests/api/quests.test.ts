import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { setupNitro } from '../utils/nitro'

let listener: Awaited<ReturnType<typeof setupNitro>>['listener']

describe('API /api/quests', () => {
  beforeAll(async () => {
    const { listener: l } = await setupNitro()
    listener = l
  })

  afterAll(async () => {
    if (listener) await listener.close()
  })

  it('GET /api/quests returns 200', async () => {
    const res = await request(listener.url).get('/api/quests')
    expect(res.status).toBe(200)
  })
})
