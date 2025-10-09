import { config } from 'dotenv'
import { execSync } from 'node:child_process'
import { setup } from '@nuxt/test-utils/runtime'
import { vi } from 'vitest'

// 🧩 Load .env.test instead of default .env
config({ path: '.env.test' })

/**
 * 🧱 Reset Prisma database before all tests.
 * Runs `pnpm --filter nuxt prisma migrate reset` with env from .env.test.
 */
beforeAll(() => {
  execSync('pnpm --filter nuxt prisma migrate reset --force --skip-generate', {
    stdio: 'inherit',
    env: {
      ...process.env, // includes DATABASE_URL from .env.test
    },
  })
})

/**
 * 🧩 Initialize Nuxt test runtime (client-side only).
 * Prevents full server boot (faster, avoids network conflicts).
 */
beforeAll(async () => {
  await setup({ server: false })
})

/**
 * 🧩 Global mocks for Nuxt composables, router, and fetch.
 * These eliminate per-file vi.mock() boilerplate and fix hoisting issues.
 */
const pushMock = vi.fn()
const routeMock = { params: { id: 'mock-id' } }

vi.mock('#app', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => routeMock,
  useNuxtApp: () => ({ $fetch: vi.fn() }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

// Global $fetch mock stub — can be overridden in individual tests
vi.stubGlobal('$fetch', vi.fn())

/**
 * 🧹 Ensure isolation: reset mocks between test files
 */
afterEach(() => {
  pushMock.mockReset()
  ;(globalThis.$fetch as any).mockReset?.()
})
