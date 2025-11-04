import { config } from 'dotenv'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, useAttrs } from 'vue'
import type { Ref } from 'vue'
import { vi } from 'vitest'
import { splitTextIntoSegments } from './app/utils/text-with-links'

type SessionUser = { id: string, [key: string]: unknown }

declare global {
  // Add custom properties to globalThis for type safety
  var defineEventHandler: ((fn: unknown) => unknown) | undefined
  var getRouterParam: ((event: { params?: Record<string, string> }, name: string) => string) | undefined
  var readBody: (() => Promise<Record<string, unknown>>) | undefined
  var createError: ((input: { statusCode?: number, status?: number, statusText?: string }) => Error & { statusCode?: number }) | undefined
  var getUserSession: (() => Promise<{ user: { id: string } }>) | undefined
  var defineNuxtRouteMiddleware: (<T>(fn: T) => T) | undefined
  var useState: (<T>(key: string, init?: () => T) => Ref<T>) | undefined
  var useCookie: (<T>(key: string, options?: unknown) => Ref<T>) | undefined
  var __resetNuxtState: (() => void) | undefined
  var useRuntimeConfig: (() => any) | undefined
  var definePageMeta: ((meta: unknown) => void) | undefined
  var useUserSession: (() => {
    user: Ref<SessionUser | null>
    loggedIn: Ref<boolean>
    fetch: ReturnType<typeof vi.fn>
    clear: ReturnType<typeof vi.fn>
    openInPopup: ReturnType<typeof vi.fn>
  }) | undefined
}

config({ path: '.env.test' })

const nuxtTsconfigPath = resolve(process.cwd(), '.nuxt/tsconfig.json')
if (!existsSync(nuxtTsconfigPath)) {
  mkdirSync(dirname(nuxtTsconfigPath), { recursive: true })
  writeFileSync(nuxtTsconfigPath, JSON.stringify({ compilerOptions: { paths: {} } }, null, 2))
}

if (!globalThis.defineEventHandler) {
  globalThis.defineEventHandler = (fn: unknown) => fn
}

if (!globalThis.defineNuxtRouteMiddleware) {
  globalThis.defineNuxtRouteMiddleware = fn => fn
}

Object.assign(globalThis, {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  useAttrs,
  splitTextIntoSegments,
})

const nuxtState = new Map<string, Ref>()

if (!globalThis.useState) {
  globalThis.useState = function useState<T>(key: string, init?: () => T) {
    if (!nuxtState.has(key)) {
      const initialValue = init ? init() : undefined
      nuxtState.set(key, ref(initialValue) as Ref)
    }

    const stored = nuxtState.get(key) as Ref<T | undefined>

    if (stored.value === undefined && init) {
      stored.value = init()
    }

    return stored as Ref<T>
  }
}

if (!globalThis.__resetNuxtState) {
  globalThis.__resetNuxtState = () => {
    nuxtState.clear()
  }
}

if (!globalThis.getRouterParam) {
  globalThis.getRouterParam = (event: { params?: Record<string, string> }, name: string) => event.params?.[name] ?? ''
}

if (!globalThis.readBody) {
  globalThis.readBody = async () => ({})
}

if (!globalThis.createError) {
  globalThis.createError = (input: { statusCode?: number, status?: number, statusText?: string }) => {
    const error = new Error(input.statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = input.statusCode ?? input.status ?? 500
    return error
  }
}

if (!globalThis.getUserSession) {
  globalThis.getUserSession = async () => ({ user: { id: 'test-user' } })
}

if (!globalThis.useRuntimeConfig) {
  globalThis.useRuntimeConfig = () => ({
    public: { features: { aiAssist: true } },
  })
}

if (!globalThis.definePageMeta) {
  globalThis.definePageMeta = () => {}
}

if (!globalThis.useUserSession) {
  const defaultUser = ref<SessionUser | null>(null)
  const defaultLoggedIn = ref(false)
  const fetch = vi.fn(async () => ({}))
  const clear = vi.fn(async () => {
    defaultUser.value = null
    defaultLoggedIn.value = false
  })
  const openInPopup = vi.fn()

  globalThis.useUserSession = () => ({
    user: defaultUser,
    loggedIn: defaultLoggedIn,
    fetch,
    clear,
    openInPopup,
  })
}

const cookieStore = new Map<string, Ref>()

if (!globalThis.useCookie) {
  globalThis.useCookie = function useCookie<T>(key: string) {
    if (!cookieStore.has(key)) {
      cookieStore.set(key, ref(null) as Ref)
    }
    return cookieStore.get(key) as Ref<T>
  }
}

vi.mock('vuetify', () => ({
  useTheme: () => ({
    global: {
      name: { value: 'light' as 'light' | 'dark' },
    },
  }),
}))
