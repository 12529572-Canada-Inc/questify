import { beforeAll } from 'vitest'
import { config } from 'dotenv'
import { execSync } from 'node:child_process'

// Load .env.test instead of default .env
config({ path: '.env.test' })

beforeAll(() => {
  try {
    execSync('pnpm --filter nuxt prisma migrate reset --force --skip-generate', {
      stdio: 'ignore',
      env: {
        ...process.env, // now includes DATABASE_URL from .env.test
      },
      timeout: 5_000,
    })
  }
  catch (error) {
    console.warn('[vitest.setup] Skipping Prisma migrate reset:', (error as Error).message)
  }
})
