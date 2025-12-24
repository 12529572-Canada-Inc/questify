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
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'
    process.env.ANTHROPIC_API_VERSION = '2023-01-01'
    process.env.DEEPSEEK_API_KEY = 'deepseek-key'
    process.env.DEEPSEEK_BASE_URL = 'https://api.custom-deepseek.com/v1'
    process.env.AI_MAX_RESPONSE_TOKENS = '900'
    process.env.WORKER_LOG_MAX_CHARS = '500'

    const { config } = await import('../src/config.js')

    expect(config).toEqual({
      openaiApiKey: 'env-openai-key',
      anthropicApiKey: 'anthropic-key',
      anthropicApiVersion: '2023-01-01',
      deepseekApiKey: 'deepseek-key',
      deepseekBaseUrl: 'https://api.custom-deepseek.com/v1',
      aiMaxResponseTokens: 900,
      logMaxChars: 500,
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
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_VERSION
    delete process.env.DEEPSEEK_API_KEY
    delete process.env.DEEPSEEK_BASE_URL
    process.env.DATABASE_URL = 'postgres://default'

    const { config } = await import('../src/config.js')

    expect(config.openaiApiKey).toBeUndefined()
    expect(config.anthropicApiKey).toBe('')
    expect(config.anthropicApiVersion).toBe('2023-06-01')
    expect(config.deepseekApiKey).toBe('')
    expect(config.deepseekBaseUrl).toBe('https://api.deepseek.com/v1')
    expect(config.aiMaxResponseTokens).toBe(0)
    expect(config.logMaxChars).toBe(0)
    expect(config.redisHost).toBe('localhost')
    expect(config.redisPort).toBe(6379)
    expect(config.redisPassword).toBeUndefined()
    expect(config.redisUrl).toBe('')
    expect(config.redisTls).toBe(false)
    expect(config.databaseUrl).toBe('postgres://default')
  })
})
