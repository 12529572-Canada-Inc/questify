import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { listen } from 'listhen'
import { createNitro } from 'nitropack'
import type { NitroApp } from 'nitropack'

let nitro: NitroApp
let listener: Awaited<ReturnType<typeof listen>>

describe('API /api/quests', () => {
  beforeAll(async () => {
    // 🧩 Create the Nitro instance directly from your Nuxt app root
    nitro = await createNitro({
      rootDir: process.cwd() + '/apps/nuxt',
      dev: true,
      preset: 'node',
    })

    // Ensure internal hooks & plugins are loaded
    if (typeof (nitro as any).init === 'function') {
      await (nitro as any).init()
    }

    // 🚀 Start a temporary server using Nitro’s internal h3App
    listener = await listen((nitro as any).h3App)
  })

  afterAll(async () => {
    if (listener) await listener.close()
    if (nitro && typeof (nitro as any).close === 'function') {
      await (nitro as any).close()
    }
  })

  it('GET /api/quests returns 200', async () => {
    const res = await request(listener.url).get('/api/quests')
    expect(res.status).toBe(200)
  })
})
