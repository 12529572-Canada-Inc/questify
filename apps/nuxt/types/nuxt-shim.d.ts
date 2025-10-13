/// <reference types="nuxt/schema" />
/// <reference types="nuxt/app" />
/// <reference types="nitropack" />
/// <reference types="h3" />
/// <reference types="vue" />

// ✅ Vue Composition API globals
declare global {
  const ref: typeof import('vue')['ref']
  const computed: typeof import('vue')['computed']
  const watch: typeof import('vue')['watch']
  const onMounted: typeof import('vue')['onMounted']
  const useAttrs: typeof import('vue')['useAttrs']
  const useRoute: typeof import('vue-router')['useRoute']
  const useRouter: typeof import('vue-router')['useRouter']
}

// Nuxt Auth composables and H3 helpers
declare global {
  // --- User Session ---
  const useUserSession: () => { user?: { id: string, email?: string, name?: string } | null }
  const getUserSession: (event?: unknown) => Promise<{ user?: { id: string, email?: string, name?: string } | null }>
  const setUserSession: (event?: unknown, data?: unknown) => Promise<void>
  const clearUserSession: (event?: unknown) => Promise<void>
  const requireUserSession: (event?: unknown) => Promise<{ user: { id: string, email?: string, name?: string } }>

  // --- Nitro & H3 ---
  const defineNitroPlugin: typeof import('nitropack')['defineNitroPlugin']
  const useRuntimeConfig: typeof import('nitropack')['useRuntimeConfig']
  const defineEventHandler: typeof import('h3')['defineEventHandler']
  const readBody: <T = unknown>(event: unknown) => Promise<T>
  const getRouterParam: (event: unknown, name: string) => string | undefined
  const createError: typeof import('h3')['createError']
}

export {}
