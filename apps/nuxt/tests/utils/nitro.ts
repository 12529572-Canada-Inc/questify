// apps/nuxt/tests/utils/nitro.ts
import { createNitro } from 'nitropack'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Unified Nuxt 4 / Nitro 2.12+ test harness.
 * – Uses .output/server if built
 * – Otherwise spins up dev-mode Nitro in-memory
 */
export async function setupNitro() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '../..')
  const outputDir = path.resolve(rootDir, '.output/server')

  // 1️⃣ Try using built Nitro bundle (for CI / prod smoke)
  const builtEntry = ['index.mjs', 'server.mjs']
    .map(f => path.join(outputDir, f))
    .find(f => fs.existsSync(f))

  if (builtEntry) {
    const mod = await import(pathToFileURL(builtEntry).href)
    const handler
      = mod.default || mod.app || mod.handler || mod.nitro || mod.createApp
    if (!handler) throw new Error(`❌ No handler export in ${builtEntry}`)

    // Minimal fake fetch that proxies to running dev server if needed
    return {
      nitro: { mode: 'production' },
      async fetch(url: string, init?: RequestInit) {
        // The built bundle can’t self-serve, so use global fetch
        const base = process.env.NUXT_TEST_BASE_URL ?? 'http://localhost:3000'
        return fetch(new URL(url, base), init)
      },
      async close() {},
    }
  }

  // 2️⃣ Fallback: create in-memory dev Nitro
  const nitro = await createNitro({
    rootDir,
    dev: true,
    preset: 'node',
  })

  // prepare() replaces old ready()
  if (typeof nitro.prepare === 'function') {
    await nitro.prepare()
  }

  // localFetch exists in 2.12+
  const fetchFn
    = typeof nitro.localFetch === 'function'
      ? nitro.localFetch.bind(nitro)
      : (url: string, opts?: RequestInit) =>
          Promise.reject(
            new Error('nitro.localFetch not available on this version'),
          )

  return {
    nitro,
    fetch: fetchFn,
    async close() {
      if (typeof nitro.close === 'function') await nitro.close()
    },
  }
}
