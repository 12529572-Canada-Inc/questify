import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { H3 } from 'h3'
import { listen } from 'listhen'
import type { NitroApp } from 'nitropack'

// 🧱 Import the built Nitro entry (after running `pnpm build`)
import nitroModule from '../.output/server/index.mjs'

let nitro: NitroApp
let app: H3
let listener: Awaited<ReturnType<typeof listen>>

describe('API /api/quests', () => {
  beforeAll(async () => {
    // 🧩 1. Extract the Nitro app instance from the built server
    // Depending on how Nitro exports, it can be default or named
    // @ts-expect-error: Nitro module export types are not consistent between builds, so we handle both default and named exports here.
    nitro = (nitroModule.default || nitroModule).nitro || nitroModule

    // 🧩 2. Create H3 instance and mount Nitro handler
    app = new H3()
    // New Nitro exports `.h3App` as the H3 application internally
    // which contains a `.handler` property for use
    // @ts-expect-error: Nitro types do not yet include h3App property, but it exists at runtime.
    app.use(nitro.h3App?.handler || nitro.handler)

    // 🚀 3. Start an HTTP listener
    // @ts-expect-error: listhen types are not yet fully compatible with H3App, but it works at runtime.
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
