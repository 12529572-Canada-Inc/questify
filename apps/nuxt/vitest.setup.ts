import { beforeAll } from 'vitest'
import { config } from 'dotenv'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { computed } from 'vue'

// ------------------------------------------------------
// 1️⃣ Load environment for tests
// ------------------------------------------------------
config({ path: '.env.test' })

// Ensure Nuxt’s generated .nuxt/tsconfig exists
const nuxtTsconfigPath = resolve(process.cwd(), '.nuxt/tsconfig.json')
if (!existsSync(nuxtTsconfigPath)) {
  mkdirSync(dirname(nuxtTsconfigPath), { recursive: true })
  writeFileSync(
    nuxtTsconfigPath,
    JSON.stringify({ compilerOptions: { paths: {} } }, null, 2),
  )
}

// ------------------------------------------------------
// 2️⃣ Mock Nitro globals so API handlers run directly
// ------------------------------------------------------
if (!globalThis.defineEventHandler) {
  globalThis.defineEventHandler = (fn: unknown) => fn
}

if (!globalThis.getUserSession) {
  globalThis.getUserSession = async () => ({
    user: { id: 'mock-user-1', name: 'Mock Tester' },
  })
}

if (!globalThis.__nuxt_app__) {
  const vueApp = {
    config: { globalProperties: {} },
    _context: { directives: {}, components: {} },
    provide: () => {},
  }
  globalThis.__nuxt_app__ = { vueApp }
}

if (!globalThis.computed) {
  globalThis.computed = computed
}

if (!globalThis.defineNuxtRouteMiddleware) {
  globalThis.defineNuxtRouteMiddleware = (handler: unknown) => handler
}

// ------------------------------------------------------
// 3️⃣ Reset database (only in integration mode)
// ------------------------------------------------------
beforeAll(() => {
  if (process.env.USE_MOCKS === 'true') {
    console.log('[vitest.setup] Running in MOCK mode (no DB reset)')
    return
  }

  try {
    console.log('[vitest.setup] Resetting Prisma test database...')
    execSync('pnpm --filter nuxt prisma migrate reset --force --skip-generate', {
      stdio: 'ignore',
      env: { ...process.env },
      timeout: 5_000,
    })
  }
  catch (error) {
    console.warn('[vitest.setup] Skipping Prisma reset:', (error as Error).message)
  }
})
