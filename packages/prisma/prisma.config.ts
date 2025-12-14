import { PrismaPg } from '@prisma/adapter-pg'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to configure the Prisma datasource.')
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)

export default defineConfig({
  schema: './schema.prisma',
  adapter: async () => adapter,
})
