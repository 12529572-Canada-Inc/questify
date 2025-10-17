import { Queue } from 'bullmq'
import { parseRedisUrl } from 'shared'

export default defineNitroPlugin((nitroApp) => {
  if (process.env.NODE_ENV === 'test') {
    console.log('Skipping task queue setup in test environment')
    return
  }

  const config = useRuntimeConfig()

  const connection = parseRedisUrl(config.redis.url) || {
    host: config.redis.host,
    port: Number(config.redis.port),
    password: config.redis.password || undefined,
    tls: config.redis.tls ? {} : undefined,
  }

  const taskQueue = new Queue('tasks', { connection })

  nitroApp.hooks.hook('request', (event) => {
    event.context.taskQueue = taskQueue
  })
})
