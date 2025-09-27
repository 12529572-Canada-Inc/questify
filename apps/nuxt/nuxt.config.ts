import type { Credentials } from '#auth'

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
  authUtils: {
    baseURL: '/api/auth',
    globalAppMiddleware: true,
    session: {
      strategy: 'jwt',
    },
    // Add a credentials provider
    providers: {
      credentials: {
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: async (credentials) => {
          // Your backend logic here
          const { email, password } = credentials
          // e.g. fetch a custom route or call Prisma here
          const user = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          }).then(r => r.json())
          if (user?.id) {
            return user
          }
          return null
        },
      } as Credentials,
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
