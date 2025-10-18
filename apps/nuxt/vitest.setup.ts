import { config } from 'dotenv'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

config({ path: '.env.test' })

const nuxtTsconfigPath = resolve(process.cwd(), '.nuxt/tsconfig.json')
if (!existsSync(nuxtTsconfigPath)) {
  mkdirSync(dirname(nuxtTsconfigPath), { recursive: true })
  writeFileSync(nuxtTsconfigPath, JSON.stringify({ compilerOptions: { paths: {} } }, null, 2))
}

if (!globalThis.defineEventHandler) {
  globalThis.defineEventHandler = ((fn: unknown) => fn) as any
}

if (!globalThis.getRouterParam) {
  globalThis.getRouterParam = ((event: { params?: Record<string, string> }, name: string) => event.params?.[name] ?? '') as any
}

if (!globalThis.readBody) {
  globalThis.readBody = (async () => ({})) as any
}

if (!globalThis.createError) {
  globalThis.createError = ((input: { statusCode?: number; status?: number; statusText?: string }) => {
    const error = new Error(input.statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = input.statusCode ?? input.status ?? 500
    return error
  }) as any
}

if (!globalThis.getUserSession) {
  globalThis.getUserSession = (async () => ({ user: { id: 'test-user' } })) as any
}
