import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { listen } from 'listhen'
import { H3 } from 'h3'
import nitroApp from '../../.output/server/index.mjs'

let listener: Awaited<ReturnType<typeof listen>>

describe('API /api/quests', () => {
  beforeAll(async () => {
    const app = new H3()
    app.use(nitroApp.h3App)

    // Start temporary HTTP server
    listener = await listen(app)
  })

  afterAll(async () => {
    await listener.close()
  })

  it('GET /api/quests returns 200', async () => {
    const res = await request(listener.url).get('/api/quests')
    expect(res.status).toBe(200)
  })
})
