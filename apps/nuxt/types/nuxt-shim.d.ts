/// <reference types="nuxt/schema" />
/// <reference types="nuxt/app" />
/// <reference types="nitropack" />
/// <reference types="h3" />
/// <reference types="vue" />

// ----------------------------------------------------
// ✅ Vue & Nuxt Composition API globals
// ----------------------------------------------------
declare global {
  const ref: typeof import('vue')['ref']
  const computed: typeof import('vue')['computed']
  const watch: typeof import('vue')['watch']
  const onMounted: typeof import('vue')['onMounted']
  const useAttrs: typeof import('vue')['useAttrs']

  const useRoute: typeof import('#app')['useRoute']
  const useRouter: typeof import('#app')['useRouter']
  const defineNuxtRouteMiddleware: typeof import('#app')['defineNuxtRouteMiddleware']
  const navigateTo: typeof import('#app')['navigateTo']
  const useFetch: typeof import('#app')['useFetch']
  const useAsyncData: typeof import('#app')['useAsyncData']
  const useRuntimeConfig: typeof import('#app')['useRuntimeConfig']
}

// ----------------------------------------------------
// ✅ User session composable typing
// ----------------------------------------------------
declare global {
  interface UserSession {
    user: { id: string, email?: string, name?: string } | null
    loggedIn: Ref<boolean>
    fetch: () => Promise<{ user?: { id: string, email?: string, name?: string } }>
    clear: () => Promise<void>
  }

  // 👉 return non-null object (recommended)
  const useUserSession: (event?: unknown) => UserSession
  const getUserSession: (event?: unknown) => Promise<{ user?: { id: string, email?: string, name?: string } } | null>
  const setUserSession: (event?: unknown, data?: unknown) => Promise<void>
  const clearUserSession: (event?: unknown) => Promise<void>
  const requireUserSession: (event?: unknown) => Promise<{ user: { id: string, email?: string, name?: string } }>
}

// ----------------------------------------------------
// ✅ Nitro / H3 helpers
// ----------------------------------------------------
declare global {
  const defineNitroPlugin: typeof import('nitropack')['defineNitroPlugin']
  const defineEventHandler: typeof import('h3')['defineEventHandler']
  const readBody: <T = unknown>(event: unknown) => Promise<T | undefined>
  const getRouterParam: (event: unknown, name: string) => string | undefined
  const createError: typeof import('h3')['createError']
}

// ----------------------------------------------------
// ✅ Vitest globals for API tests
// ----------------------------------------------------
declare global {
  const describe: typeof import('vitest')['describe']
  const it: typeof import('vitest')['it']
  const expect: typeof import('vitest')['expect']
  const beforeAll: typeof import('vitest')['beforeAll']
  const afterAll: typeof import('vitest')['afterAll']
}

// ----------------------------------------------------
// ✅ Nitro internal augmentation for tests
// ----------------------------------------------------
declare module 'nitropack' {
  export interface NitroApp {
    h3App?: import('h3').H3App
    handler?: import('h3').EventHandler
  }
  export interface Nitro {
    h3App?: import('h3').H3App
  }
}

declare module 'h3' {
  export interface H3App {
    handler?: unknown
    handle?: unknown
  }
}

export {}
