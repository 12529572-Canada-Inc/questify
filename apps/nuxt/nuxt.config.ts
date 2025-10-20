import { defineNuxtConfig } from 'nuxt/config'
import type { NuxtConfig } from 'nuxt/schema'
import path from 'path'

// 🧠 Nuxt 4 Configuration — Questify
export default defineNuxtConfig({
  // ✅ Framework compatibility (locks in Nuxt 4 behavior)
  compatibilityDate: '2025-10-12',

  // 🗂️ Source directory (where your app/ folder is located)
  alias: {
    // Point ~ and @ to new app/ directory
    '~': path.resolve(__dirname, 'app'),
    '@': path.resolve(__dirname, 'app'),
    '#prisma-utils': path.resolve(__dirname, '..', '..', 'packages', 'prisma', 'utils'),
  },

  // ⚙️ Modules
  modules: [
    '@nuxt/eslint',
    'vuetify-nuxt-module',
    'nuxt-auth-utils',
  ],

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

  // 🧱 Auto-imported components
  components: {
    dirs: [
      { path: '~/components', pathPrefix: false },
    ],
  },

  css: [
    '@mdi/font/css/materialdesignicons.css',
  ],

  // Hooks for debugging
  //   hooks: {
  //     'components:dirs'(dirs) {
  //       console.log('Component scan dirs:', dirs)
  //     },
  //   },

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
    optimizeDeps: { exclude: ['@vite-plugin-checker-runtime'] },
    plugins: [],
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
    preset: process.env.NODE_ENV === 'test' ? 'node' : undefined,
    externals: {
      inline: ['vue', '@vue/server-renderer'],
    },
  },

  // 🧪 Experimental features for performance
  experimental: {
    asyncContext: true,
  },

  // 🔗 Hooks
  hooks: {
    'vite:extendConfig'(config) {
      // Disable vite-plugin-checker in test or CI contexts
      if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.CI) {
        config.plugins = (config.plugins || []).filter(
          plugin => !(plugin && typeof plugin === 'object' && 'name' in plugin && String(plugin.name).includes('vite:checker')),
        )
      }
    },
  },

  // 💡 Vuetify customization (optional)
  // vuetify: {
  //   moduleOptions: {},
  //   vuetifyOptions: {},
  // },
} satisfies NuxtConfig)
