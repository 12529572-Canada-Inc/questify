import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { describe, it, expect } from 'vitest'

const rootDir = fileURLToPath(new URL('../..', import.meta.url))
const configPath = path.join(rootDir, 'nuxt.config.ts')

describe('Nuxt application configuration', () => {
  it('declares the expected head metadata and aliases', async () => {
    const configSource = await fs.readFile(configPath, 'utf-8')

    expect(configSource).toContain("title: 'Questify'")
    expect(configSource).toContain("'~': path.resolve(__dirname, 'app')")
    expect(configSource).toContain("'@': path.resolve(__dirname, 'app')")
  })
})
