export default defineNuxtConfig({
  modules: ['@nuxt/eslint', 'auth-utils/nuxt', 'vuetify-nuxt-module'],
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
    baseURL: '/api/auth', // our custom API routes
    cookie: {
      name: 'auth.session',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
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
