import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { listen } from 'listhen'

import type { NitroApp } from 'nitropack'

/**
 * Bootstraps a real Nitro app for integration tests.
 * - Ensures Nuxt is built (so .output/server/index.mjs exists)
 * - Imports the built Nitro entry
 * - Returns both the Nitro instance and a live listener URL
 */
export async function setupNitro() {
  const rootDir = process.cwd()
  const outputPath = join(rootDir, 'apps/nuxt/.output/server/index.mjs')

  // 🏗 Ensure Nuxt is built
  if (!existsSync(outputPath)) {
    console.log('🛠  Building Nuxt before running tests...')
    execSync('pnpm --filter nuxt build', { stdio: 'inherit' })
  }

  // 🧩 Dynamically import the built Nitro module
  const mod = await import(outputPath)

  // Support all export shapes seen across Nitro versions
  const nitro: NitroApp
    = (mod as any).nitro
      || (mod as any).default?.nitro
      || (mod as any).default
      || (mod as any)

  // Normalize the handler reference (app vs handler)
  const nodeHandler
    = (nitro as any).app || (nitro as any).handler || (nitro as any).h3App?.handler

  if (!nodeHandler) {
    throw new Error('❌ Could not find a valid Nitro handler')
  }

  // 🚀 Spin up a temporary HTTP server
  const listener = await listen(nodeHandler, { showURL: false })

  return { nitro, listener }
}
