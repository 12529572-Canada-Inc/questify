import { PrismaPg } from '@prisma/adapter-pg'
import { defineConfig, env } from 'prisma/config'
import { Pool } from 'pg'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

// Ensure DATABASE_URL is available when Prisma CLI loads this config.
loadEnv({ path: resolve(__dirname, '.env') })
loadEnv({ path: resolve(__dirname, '../../.env') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to configure the Prisma datasource.')
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)

export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    url: env<{ DATABASE_URL: string }>('DATABASE_URL'),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
  adapter: async () => adapter,
})
