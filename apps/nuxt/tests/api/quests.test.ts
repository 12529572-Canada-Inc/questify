// apps/nuxt/tests/api/quests.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupNitro } from '../utils/nitro'

let ctx: Awaited<ReturnType<typeof setupNitro>>

beforeAll(async () => {
  ctx = await setupNitro()
})

afterAll(async () => {
  await ctx.close()
})

describe('API /api/quests', () => {
  it('GET /api/quests returns 200', async () => {
    const res = await ctx.fetch('/api/quests')
    expect(res.status).toBe(200)
  })
})
