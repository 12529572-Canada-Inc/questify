import { config } from 'dotenv'
import { execSync } from 'node:child_process'

// Load .env.test instead of default .env
config({ path: '.env.test' })

beforeAll(() => {
  console.log('Resetting Prisma test DB...')
  execSync('pnpm --filter nuxt prisma migrate reset --force --skip-generate', {
    stdio: 'inherit',
    env: {
      ...process.env, // now includes DATABASE_URL from .env.test
    },
  })
})
