import { Queue } from 'bullmq'
import { parseRedisUrl } from 'shared/server'
import type { NitroApp } from 'nitropack'

/**
 * Lazily wires BullMQ queues into the Nitro request context so API routes can enqueue jobs.
 */

type QueueContextKey = 'questQueue' | 'taskQueue'

type QueueOptions = {
  nitroApp: NitroApp
  queueName: string
  contextKey: QueueContextKey
  label: string
}

export function setupQueue({ nitroApp, queueName, contextKey, label }: QueueOptions) {
  if (process.env.NODE_ENV === 'test') {
    console.log(`Skipping ${label} queue setup in test environment`)
    return
  }

  const config = useRuntimeConfig()

  const connection = parseRedisUrl(config.redis.url) || {
    host: config.redis.host,
    port: Number(config.redis.port),
    password: config.redis.password || undefined,
    tls: config.redis.tls ? {} : undefined,
  }

  let queue: unknown
  try {
    queue = new Queue(queueName, { connection })
  }
  catch {
    // Support factory-style mocks in tests without breaking real constructor usage
    queue = (Queue as unknown as (name: string, options: unknown) => unknown)(queueName, { connection })
  }

  nitroApp.hooks.hook('request', (event) => {
    event.context[contextKey] = queue
  })
}
