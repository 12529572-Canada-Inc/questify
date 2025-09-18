import { Queue } from 'bullmq'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  // Create the queue
  const questQueue = new Queue('quests', {
    connection: {
      host: config.redis.host,
      port: Number(config.redis.port),
      password: config.redis.password || undefined
    }
  })

  // Return something if needed
  return {
    provide: {
      questQueue
    }
  }
})
