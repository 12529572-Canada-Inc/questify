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

  // Optionally, you could also attach to nuxtApp so other parts of app can access
  nuxtApp.provide('questQueue', questQueue)

  // Return something if needed
  return {
    provide: {
      questQueue
    }
  }
})
