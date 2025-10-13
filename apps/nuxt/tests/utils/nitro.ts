// apps/nuxt/tests/utils/nitro.ts
import { createNitro } from 'nitropack'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildNitro } from 'nitropack/runtime'
import { toFetch } from 'h3'

export async function setupNitro() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '../..')

  // 🧩 Create Nitro instance
  const nitro = await createNitro({
    rootDir,
    dev: true,
    preset: 'node',
  })

  // Build the runtime (replaces nitro.ready())
  await buildNitro(nitro)

  // Adapter: expose a fetch wrapper
  const fetch = toFetch(nitro.h3App)

  return {
    nitro,
    fetch,
    async close() {
      // optional cleanup; Nitro 2.12+ has no explicit close()
    },
  }
}
