import { config } from 'dotenv'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, useAttrs } from 'vue'
import { splitTextIntoSegments } from './app/utils/text-with-links'

declare global {
  // Add custom properties to globalThis for type safety
  var defineEventHandler: ((fn: unknown) => unknown) | undefined
  var getRouterParam: ((event: { params?: Record<string, string> }, name: string) => string) | undefined
  var readBody: (() => Promise<Record<string, unknown>>) | undefined
  var createError: ((input: { statusCode?: number, status?: number, statusText?: string }) => Error & { statusCode?: number }) | undefined
  var getUserSession: (() => Promise<{ user: { id: string } }>) | undefined
  var defineNuxtRouteMiddleware: (<T>(fn: T) => T) | undefined
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
