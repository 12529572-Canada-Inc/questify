import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { H3 } from 'h3'
import { listen } from 'listhen'
import { createNitro } from 'nitropack'

let nitro: Awaited<ReturnType<typeof createNitro>>
let listener: Awaited<ReturnType<typeof listen>>

describe('API /api/quests', () => {
  beforeAll(async () => {
    // 🧱 1. Dynamically build the Nitro app in-memory
    nitro = await createNitro({
      rootDir: process.cwd(),
      preset: 'node-server',
    })
    await nitro.ready()

    // 🧩 2. Create H3 app and attach Nitro handler
    const app = new H3()
    app.use(nitro.handler)

    // 🚀 3. Start a temporary HTTP listener via listhen
    listener = await listen(app.listener)
  })

  afterAll(async () => {
    await listener.close()
    await nitro.close()
  })

  it('GET /api/quests returns 200', async () => {
    const res = await request(listener.url).get('/api/quests')
    expect(res.status).toBe(200)
  })
})
