import { Queue } from 'bullmq'
import { parseRedisUrl } from 'shared'

export default defineNitroPlugin((nitroApp) => {
  const shouldSkip =
    process.env.NODE_ENV === 'test' || process.env.NUXT_DISABLE_QUEUE === 'true'

  if (shouldSkip) {
    console.log('Skipping quest queue setup in test environment')
    return
  }

  const config = useRuntimeConfig()

  const connection = parseRedisUrl(config.redis.url) || {
    host: config.redis.host,
    port: Number(config.redis.port),
    password: config.redis.password || undefined,
    tls: config.redis.tls ? {} : undefined,
  }

  const questQueue = new Queue('quests', { connection })

  // Register the queue in Nitro's context
  nitroApp.hooks.hook('request', (event) => {
    event.context.questQueue = questQueue
  })
})
