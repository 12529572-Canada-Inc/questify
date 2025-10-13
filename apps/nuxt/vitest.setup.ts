// apps/nuxt/vitest.setup.ts
import { vi } from 'vitest'
import { config } from 'dotenv'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// ------------------------------------------------------
// 1️⃣ Load .env.test (but avoid real DB calls later)
// ------------------------------------------------------
config({ path: '.env.test' })

// ------------------------------------------------------
// 2️⃣ Create dummy .nuxt/tsconfig.json if missing
// ------------------------------------------------------
const nuxtTsconfigPath = resolve(process.cwd(), '.nuxt/tsconfig.json')
if (!existsSync(nuxtTsconfigPath)) {
  mkdirSync(dirname(nuxtTsconfigPath), { recursive: true })
  writeFileSync(
    nuxtTsconfigPath,
    JSON.stringify({ compilerOptions: { paths: {} } }, null, 2),
  )
}

// ------------------------------------------------------
// 3️⃣ Mock Prisma globally (critical for Nitro server)
// ------------------------------------------------------
vi.mock('@prisma/client', async () => {
  console.log('[Vitest] 🔄 Mocking @prisma/client (no DB connection)')

  // Return a fake PrismaClient that resolves immediately
  return {
    PrismaClient: class {
      quest = {
        findMany: async () => [
          {
            id: 'mock-quest-1',
            title: 'Mock Quest',
            description: 'Mocked quest data from vitest.setup.ts',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
        ],
      }

      // Optional for handlers that call disconnect()
      async $disconnect() {
        console.log('[Vitest] Prisma mock disconnected')
      }
    },
  }
})

// ------------------------------------------------------
// 4️⃣ Skip actual DB reset (optional safety)
// ------------------------------------------------------
// You can leave this commented out to prevent resetting real DB
/*
beforeAll(() => {
  try {
    execSync('pnpm --filter nuxt prisma migrate reset --force --skip-generate', {
      stdio: 'ignore',
      env: { ...process.env },
      timeout: 5_000,
    })
  } catch (error) {
    console.warn('[vitest.setup] Skipping Prisma migrate reset:', (error as Error).message)
  }
})
*/
