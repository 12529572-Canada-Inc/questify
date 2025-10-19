import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('worker config', () => {
  it('reads configuration from environment variables', async () => {
    process.env.OPENAI_API_KEY = 'env-openai-key'
    process.env.REDIS_HOST = 'redis-host'
    process.env.REDIS_PORT = '6385'
    process.env.REDIS_PASSWORD = 'redis-pass'
    process.env.REDIS_URL = 'redis://example:6385'
    process.env.REDIS_TLS = 'true'
    process.env.DATABASE_URL = 'postgres://env'

    const { config } = await import('../src/config.js')

    expect(config).toEqual({
      openaiApiKey: 'env-openai-key',
      redisHost: 'redis-host',
      redisPort: 6385,
      redisPassword: 'redis-pass',
      redisUrl: 'redis://example:6385',
      redisTls: true,
      databaseUrl: 'postgres://env',
    })
  })

  it('falls back to defaults when env vars are missing', async () => {
    delete process.env.OPENAI_API_KEY
    delete process.env.REDIS_HOST
    delete process.env.REDIS_PORT
    delete process.env.REDIS_PASSWORD
    delete process.env.REDIS_URL
    delete process.env.REDIS_TLS
    process.env.DATABASE_URL = 'postgres://default'

    const { config } = await import('../src/config.js')

    expect(config.openaiApiKey).toBeUndefined()
    expect(config.redisHost).toBe('localhost')
    expect(config.redisPort).toBe(6379)
    expect(config.redisPassword).toBeUndefined()
    expect(config.redisUrl).toBe('')
    expect(config.redisTls).toBe(false)
    expect(config.databaseUrl).toBe('postgres://default')
  })
})
