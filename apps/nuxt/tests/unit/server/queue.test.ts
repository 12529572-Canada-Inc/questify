import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupQueue } from '../../../server/utils/queue'

type UseRuntimeConfigMock = () => {
  redis: {
    url: string
    host: string
    port: string | number
    password?: string | null
    tls?: boolean
  }
}

type GlobalWithMocks = typeof globalThis & {
  useRuntimeConfig?: UseRuntimeConfigMock
}

const queueInstance = { id: 'queue-instance' }

const mocks = vi.hoisted(() => ({
  Queue: vi.fn(() => queueInstance),
  parseRedisUrl: vi.fn(),
}))

vi.mock('bullmq', () => ({
  Queue: mocks.Queue,
}))

vi.mock('shared', () => ({
  parseRedisUrl: mocks.parseRedisUrl,
}))

const globalWithMocks = globalThis as GlobalWithMocks
const originalUseRuntimeConfig = globalWithMocks.useRuntimeConfig
const originalNodeEnv = process.env.NODE_ENV

beforeEach(() => {
  mocks.Queue.mockClear()
  mocks.parseRedisUrl.mockReset()

  Reflect.set(globalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
    redis: {
      url: '',
      host: 'localhost',
      port: '6379',
      password: null,
      tls: false,
    },
  })))
  process.env.NODE_ENV = 'development'
})

afterEach(() => {
  if (originalUseRuntimeConfig) Reflect.set(globalWithMocks, 'useRuntimeConfig', originalUseRuntimeConfig)
  else Reflect.deleteProperty(globalWithMocks, 'useRuntimeConfig')

  process.env.NODE_ENV = originalNodeEnv
})

describe('setupQueue', () => {
  it('skips queue creation in test environments', () => {
    process.env.NODE_ENV = 'test'

    const hook = vi.fn()
    setupQueue({
      nitroApp: { hooks: { hook } } as never,
      queueName: 'quests',
      contextKey: 'questQueue',
      label: 'quest',
    })

    expect(mocks.Queue).not.toHaveBeenCalled()
    expect(hook).not.toHaveBeenCalled()
  })

  it('creates a queue and stores it on the event context', async () => {
    mocks.parseRedisUrl.mockReturnValue({ host: 'redis-host', port: 6380 })
    const hook = vi.fn((_eventName: string, handler: (event: { context: Record<string, unknown> }) => void) => {
      const event = { context: {} as Record<string, unknown> }
      handler(event)
      expect(event.context.questQueue).toBe(queueInstance)
    })

    setupQueue({
      nitroApp: { hooks: { hook } } as never,
      queueName: 'quests',
      contextKey: 'questQueue',
      label: 'quest',
    })

    expect(mocks.Queue).toHaveBeenCalledWith('quests', { connection: { host: 'redis-host', port: 6380 } })
    expect(hook).toHaveBeenCalledWith('request', expect.any(Function))
  })

  it('falls back to runtime redis configuration when URL parsing fails', () => {
    mocks.parseRedisUrl.mockReturnValue(null)
    Reflect.set(globalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
      redis: {
        url: '',
        host: 'fallback-host',
        port: '6382',
        password: 'secret',
        tls: true,
      },
    })))

    setupQueue({
      nitroApp: { hooks: { hook: vi.fn() } } as never,
      queueName: 'tasks',
      contextKey: 'taskQueue',
      label: 'task',
    })

    expect(mocks.Queue).toHaveBeenCalledWith('tasks', {
      connection: {
        host: 'fallback-host',
        port: 6382,
        password: 'secret',
        tls: {},
      },
    })
  })
})
