// apps/nuxt/tests/utils/nitro.ts
import { createNitro } from 'nitropack'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Creates or loads a Nitro instance for testing.
 *  - Prefers in-memory dev mode (fast)
 *  - Falls back to built bundle (.output/server/index.mjs) if present
 */
export async function setupNitro() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '../..')
  const outputDir = path.resolve(rootDir, '.output/server')
  const entryCandidates = ['index.mjs', 'server.mjs'].map(f =>
    path.join(outputDir, f),
  )

  // ----------------------------
  // 🧱 1. Try using the built Nitro bundle (for CI)
  // ----------------------------
  for (const entry of entryCandidates) {
    if (fs.existsSync(entry)) {
      const mod = await import(pathToFileURL(entry).href)
      const handler = mod.default || mod.app || mod.handler || mod.nitro
      if (!handler) throw new Error(`No default export in ${entry}`)
      return {
        nitro: { mode: 'production' },
        fetch: async (url: string, init?: RequestInit) => {
          const { request } = await import('undici')
          const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
          return request(new URL(url, baseUrl).toString(), init)
        },
        async close() {
          // no-op in built mode
        },
      }
    }
  }

  // ----------------------------
  // ⚙️ 2. Fallback: create in-memory Nitro (fast dev test mode)
  // ----------------------------
  const nitro = await createNitro({
    rootDir,
    dev: true,
    preset: 'node', // avoid vercel sandbox
  })

  // prepare() replaces old .ready()
  if (typeof (nitro as any).prepare === 'function') {
    await (nitro as any).prepare()
  }

  // Try the most stable fetch adapter available
  let fetchFn: any
  try {
    const { toFetch } = await import('nitropack/runtime/internal/fetch')
    fetchFn = toFetch(nitro.h3App)
  }
  catch {
    // Fallback if API changes again
    fetchFn = (await import('h3')).toWebRequest
      ? (await import('h3')).toWebRequest(nitro.h3App)
      : (url: string) => nitro.h3App.handler({ url } as any)
  }

  return {
    nitro,
    fetch: fetchFn,
    async close() {
      if (typeof nitro.close === 'function') await nitro.close()
    },
  }
}
