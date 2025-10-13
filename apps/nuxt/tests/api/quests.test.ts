import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { H3 } from 'h3'
import { listen } from 'listhen'
import { loadNitro, nitroApp } from 'nitropack/runtime'

let listener: Awaited<ReturnType<typeof listen>>

describe('API /api/quests', () => {
  beforeAll(async () => {
    // 🧱 Load Nitro runtime from your built output (no need for createNitro/buildNitro)
    const nitro = await loadNitro({
      rootDir: process.cwd(),
      preset: 'node-server',
    })

    // 🧩 Create H3 app and attach Nitro’s built-in app
    const app = new H3()
    app.use(nitroApp(nitro))

    // 🚀 Start temporary HTTP listener
    listener = await listen(app)
  })

  afterAll(async () => {
    if (listener) await listener.close()
  })

  it('GET /api/quests returns 200', async () => {
    const res = await request(listener.url).get('/api/quests')
    expect(res.status).toBe(200)
  })
})
