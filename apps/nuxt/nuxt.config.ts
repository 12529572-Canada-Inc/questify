export default defineNuxtConfig({
  nitro: {
    compatibilityDate: '2025-09-17', // update this every 3 months
  },
  runtimeConfig: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
      password: process.env.REDIS_PASSWORD || ''
    }
  },
})