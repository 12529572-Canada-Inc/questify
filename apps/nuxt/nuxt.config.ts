import { defineNuxtConfig } from 'nuxt/config'
import type { NuxtConfig } from 'nuxt/schema'

// 🧠 Nuxt 4 Configuration — Questify (Vuetify + Auth + Redis)
export default defineNuxtConfig({
  // ✅ Framework compatibility (locks in Nuxt 4 behavior)
  compatibilityDate: '2025-10-12',

  // ⚙️ Modules
  modules: [
    '@nuxt/eslint',
    'vuetify-nuxt-module',
    'nuxt-auth-utils',
  ],

  // 🔍 Auto-imports (middleware, composables, utils, etc.)
  imports: {
    dirs: ['middleware'],
  },

  // 🌐 App metadata and head configuration
  app: {
    head: {
      title: 'Questify',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ],
    },
  },

  // 🧩 Runtime configuration
  runtimeConfig: {
    // 🔒 Server-only (not exposed to client)
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
      password: process.env.REDIS_PASSWORD || '',
      url: process.env.REDIS_URL || '',
      tls: process.env.REDIS_TLS === 'true',
    },

    // 🌍 Client-exposed
    public: {
      appEnv: process.env.NODE_ENV,
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      questifyVersion: '4.1.3',
    },
  },

  // 🧰 TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
        esModuleInterop: true,
        allowJs: false,
        target: 'ES2022',
      },
    },
  },

  // ⚡ Vite configuration
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
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

  // 🧱 Build options
  build: {
    transpile: ['vuetify'],
  },

  // 🚀 Nitro (server engine) config
  nitro: {
    preset: process.env.NITRO_PRESET || 'vercel', // or 'fly' for worker deployments
    serveStatic: true,
    compressPublicAssets: true,
  },

  // 🧪 Experimental features for performance
  experimental: {
    asyncContext: true,
  },

  // 💡 Vuetify customization (optional)
  // vuetify: {
  //   moduleOptions: {},
  //   vuetifyOptions: {},
  // },
} satisfies NuxtConfig)
