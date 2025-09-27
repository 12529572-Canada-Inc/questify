import { authorize } from './server/utils/auth'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@sidebase/nuxt-auth', 'vuetify-nuxt-module'],
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
  compatibilityDate: '2025-09-25',
  typescript: {
    strict: true,
    typeCheck: true,
  },
  auth: {
    isEnabled: true,
    origin: process.env.AUTH_ORIGIN || 'http://localhost:3000',
    basePath: '/api/auth',
    enableGlobalAppMiddleware: true,
    defaultProvider: 'credentials',
    provider: {
      type: 'credentials',
      authorize,
    },
  },
  vuetify: {
    moduleOptions: {
      // Optional module-specific flags
    },
    vuetifyOptions: {
      // Custom Vuetify options (themes, icons, etc.)
    },
  },
})
