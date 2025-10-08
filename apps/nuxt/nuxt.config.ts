export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    'vuetify-nuxt-module',
    'nuxt-auth-utils',
  ],
  imports: {
    dirs: ['middleware'],
  },
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
  vite: {
    plugins: [
      // Add any Vite plugins here
      ...(process.env.NODE_ENV === 'test' ? [] : []),
    ],
    server: {
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.turbo/**',
          '**/.output/**',
        ],
      },
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
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
