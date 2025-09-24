export default defineNuxtConfig({
  modules: ['@nuxt/eslint', 'vuetify-nuxt-module'],
  // rest of your config...
  runtimeConfig: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
      password: process.env.REDIS_PASSWORD || '',
      url: process.env.REDIS_URL || '',
      tls: process.env.REDIS_TLS === 'true',
    },
  },
  nitro: {
    compatibilityDate: '2025-09-17', // update this every 3 months
  },
})
