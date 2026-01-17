import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NitroApp } from 'nitropack'
import { setupQueue } from '../../../server/utils/queue'
import { parseRedisUrl } from 'shared/server'

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(function Queue(name: string, options: unknown) {
    return { name, options }
  }),
}))

vi.mock('shared/server', () => ({
  parseRedisUrl: vi.fn(() => ({ host: 'parsed', port: 9999 })),
}))

describe('server/utils/queue', () => {
  const originalEnv = process.env.NODE_ENV
  const globalStore = globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown }
  const originalRuntimeConfig = globalStore.useRuntimeConfig
  type TestEvent = { context: Record<string, unknown> }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    Reflect.set(globalStore, 'useRuntimeConfig', () => ({
      redis: { url: 'redis://localhost:6379', host: 'localhost', port: 6379, password: '', tls: false },
    }))
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    if (originalRuntimeConfig) Reflect.set(globalStore, 'useRuntimeConfig', originalRuntimeConfig)
  })

  it('skips queue setup in test environments', () => {
    process.env.NODE_ENV = 'test'
    const hook = vi.fn()
    const nitroApp = { hooks: { hook } } as unknown as NitroApp
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    setupQueue({ nitroApp, queueName: 'test-queue', contextKey: 'questQueue', label: 'Quest' })

    expect(hook).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping Quest queue setup'))
    consoleSpy.mockRestore()
  })

  it('attaches queue to nitro context when enabled', () => {
    const event: TestEvent = { context: {} }
    const hook = vi.fn((name: string, cb: (event: TestEvent) => void) => cb(event))
    const nitroApp = { hooks: { hook } } as unknown as NitroApp

    setupQueue({ nitroApp, queueName: 'quest-queue', contextKey: 'questQueue', label: 'Quest' })

    expect(hook).toHaveBeenCalled()
    expect(event.context.questQueue).toBeDefined()
  })

  it('builds queue connection from config when redis url is not parsed', () => {
    vi.mocked(parseRedisUrl).mockReturnValueOnce(null)
    const event: TestEvent = { context: {} }
    const hook = vi.fn((name: string, cb: (event: TestEvent) => void) => cb(event))
    const nitroApp = { hooks: { hook } } as unknown as NitroApp

    setupQueue({ nitroApp, queueName: 'task-queue', contextKey: 'taskQueue', label: 'Task' })

    const assigned = event.context.taskQueue as { options: { connection: { host: string } } }
    expect(assigned.options.connection.host).toBe('localhost')
  })
})
