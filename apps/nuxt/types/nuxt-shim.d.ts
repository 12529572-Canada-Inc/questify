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

// ✅ Nuxt-specific helpers
declare global {
  const useFetch: typeof import('#app')['useFetch']
  const defineNuxtRouteMiddleware: typeof import('#app')['defineNuxtRouteMiddleware']
  const navigateTo: typeof import('#app')['navigateTo']
  const useUserSession: unknown
  const defineNitroPlugin: typeof import('nitropack')['defineNitroPlugin']
  const useRuntimeConfig: typeof import('nitropack')['useRuntimeConfig']
  const defineEventHandler: typeof import('h3')['defineEventHandler']
  const readBody: typeof import('h3')['readBody']
  const getRouterParam: typeof import('h3')['getRouterParam']
  const createError: typeof import('h3')['createError']
  const getUserSession: unknown
  const setUserSession: unknown
  const clearUserSession: unknown
  const requireUserSession: unknown
}

export {}
