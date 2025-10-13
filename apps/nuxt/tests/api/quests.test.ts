import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { listen } from 'listhen'
import type { NitroApp } from 'nitropack'

// 🧱 Import the built Nitro entry (after running `pnpm build`)
import nitroModule from '../.output/server/index.mjs'

let nitro: NitroApp
let listener: Awaited<ReturnType<typeof listen>>

describe('API /api/quests', () => {
  beforeAll(async () => {
    // 🧩 1. Extract the Nitro app instance from the built server
    // Depending on how Nitro exports, it can be default or named
    // @ts-expect-error: Nitro module export types are not consistent between builds, so we handle both default and named exports here.
    nitro = (nitroModule.default || nitroModule).nitro || nitroModule

    // 🚀 3. Start an HTTP listener
    listener = await listen(nitro.handler) // Use port 0 for dynamic port assignment
  })

  afterAll(async () => {
    if (listener) await listener.close()
  })

  it('GET /api/quests returns 200', async () => {
    const res = await request(listener.url).get('/api/quests')
    expect(res.status).toBe(200)
  })
})
