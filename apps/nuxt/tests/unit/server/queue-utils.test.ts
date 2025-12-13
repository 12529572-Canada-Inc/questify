import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupQueue } from '../../../server/utils/queue'
import { parseRedisUrl } from 'shared/server'

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation((name: string, options: unknown) => ({ name, options })),
}))

vi.mock('shared/server', () => ({
  parseRedisUrl: vi.fn(() => ({ host: 'parsed', port: 9999 })),
}))

describe('server/utils/queue', () => {
  const originalEnv = process.env.NODE_ENV
  const originalRuntimeConfig = globalThis.useRuntimeConfig

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    globalThis.useRuntimeConfig = () => ({
      redis: { url: 'redis://localhost:6379', host: 'localhost', port: 6379, password: '', tls: false },
    })
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    if (originalRuntimeConfig) globalThis.useRuntimeConfig = originalRuntimeConfig
  })

  it('skips queue setup in test environments', () => {
    process.env.NODE_ENV = 'test'
    const hook = vi.fn()
    const nitroApp = { hooks: { hook } } as any
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    setupQueue({ nitroApp, queueName: 'test-queue', contextKey: 'questQueue', label: 'Quest' })

    expect(hook).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping Quest queue setup'))
    consoleSpy.mockRestore()
  })

  it('attaches queue to nitro context when enabled', () => {
    const event = { context: {} }
    const hook = vi.fn((name: string, cb: (event: any) => void) => cb(event))
    const nitroApp = { hooks: { hook } } as any

    setupQueue({ nitroApp, queueName: 'quest-queue', contextKey: 'questQueue', label: 'Quest' })

    expect(hook).toHaveBeenCalled()
    expect(event.context.questQueue).toBeDefined()
  })

  it('builds queue connection from config when redis url is not parsed', () => {
    vi.mocked(parseRedisUrl).mockReturnValueOnce(null as any)
    const event = { context: {} as Record<string, any> }
    const hook = vi.fn((name: string, cb: (event: any) => void) => cb(event))
    const nitroApp = { hooks: { hook } } as any

    setupQueue({ nitroApp, queueName: 'task-queue', contextKey: 'taskQueue', label: 'Task' })

    const assigned = event.context.taskQueue
    expect(assigned.options.connection.host).toBe('localhost')
  })
})
