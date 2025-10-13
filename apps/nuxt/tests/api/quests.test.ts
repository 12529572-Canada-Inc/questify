import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupNitro } from '../utils/nitro'

let nitro: Awaited<ReturnType<typeof setupNitro>>

beforeAll(async () => {
  nitro = await setupNitro()
})

afterAll(async () => {
  await nitro.close()
})

describe('API /api/quests', () => {
  it('GET /api/quests returns 200', async () => {
    const res = await nitro.fetch('/api/quests')
    expect(res.status).toBe(200)
  })
})
