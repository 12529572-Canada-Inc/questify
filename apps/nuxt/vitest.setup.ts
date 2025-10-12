import { beforeAll } from 'vitest'
import { config } from 'dotenv'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// Load .env.test instead of default .env
config({ path: '.env.test' })

const nuxtTsconfigPath = resolve(process.cwd(), '.nuxt/tsconfig.json')

if (!existsSync(nuxtTsconfigPath)) {
  mkdirSync(dirname(nuxtTsconfigPath), { recursive: true })
  writeFileSync(
    nuxtTsconfigPath,
    JSON.stringify(
      {
        compilerOptions: {
          paths: {},
        },
      },
      null,
      2,
    ),
  )
}

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
