import type { NuxtConfig } from 'nuxt/schema'

const config: NuxtConfig = {
  modules: [
    '@nuxt/eslint',
    'vuetify-nuxt-module',
    'nuxt-auth-utils',
  ],
  imports: {
    dirs: ['middleware'],
  },
  app: {
    head: {
      title: 'Questify',
      link: [
        // SVG favicon
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },

        // Fallback for browsers that don't support SVG favicons
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ],
    },
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
//   vuetify: {
//     moduleOptions: {
//       // Optional module-specific flags
//     },
//     vuetifyOptions: {
//     },
//   },
}

export default defineNuxtConfig(config)
