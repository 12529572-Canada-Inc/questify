// server/plugins/quest-queue.ts
import { Queue } from 'bullmq'

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()

  const questQueue = new Queue('quests', {
    connection: {
      host: config.redis.host,
      port: Number(config.redis.port),
      password: config.redis.password || undefined
    }
  })

  // Attach to Nitro so it’s available everywhere in server routes
  nitroApp.locals.questQueue = questQueue
})
