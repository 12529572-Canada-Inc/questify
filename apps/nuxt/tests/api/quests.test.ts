import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { listen } from 'listhen'
import { H3 } from 'h3'
import type { NitroApp } from 'nitropack'
import nitroApp from '../../.output/server/index.mjs'

let listener: Awaited<ReturnType<typeof listen>>

describe('API /api/quests', () => {
  beforeAll(async () => {
    // Create a new H3 instance
    const app = new H3()

    // Explicitly cast nitroApp to NitroApp for types
    const nitro = nitroApp as unknown as NitroApp

    // Attach Nitro's handler (modern syntax)
    app.use(nitro.handler)

    // Listen using H3’s native listener property
    listener = await listen(app.listener)
  })

  afterAll(async () => {
    await listener.close()
  })

  it('GET /api/quests returns 200', async () => {
    const res = await request(listener.url).get('/api/quests')
    expect(res.status).toBe(200)
  })
})
