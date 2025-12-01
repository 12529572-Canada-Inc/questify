import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveCloudinaryConfig, signCloudinaryParams } from '../../../server/utils/cloudinary'

type RuntimeConfig = {
  cloudinary?: {
    cloudName?: string
    apiKey?: string
    apiSecret?: string
    uploadFolder?: string
  }
}

const globalWithMocks = globalThis as typeof globalThis & {
  useRuntimeConfig?: (event?: unknown) => RuntimeConfig
  createError?: (input: { status?: number, statusText?: string }) => Error
}

const originalUseRuntimeConfig = globalWithMocks.useRuntimeConfig
const originalCreateError = globalWithMocks.createError

beforeEach(() => {
  vi.restoreAllMocks()

  Reflect.set(globalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
    cloudinary: {
      cloudName: ' demo-cloud ',
      apiKey: ' key-123 ',
      apiSecret: ' secret-xyz ',
      uploadFolder: '  questify/uploads  ',
    },
  })))

  Reflect.set(globalWithMocks, 'createError', ({ status, statusText }) => {
    const error = new Error(statusText ?? 'Error') as Error & { status?: number }
    error.status = status
    return error
  })
})

afterEach(() => {
  if (originalUseRuntimeConfig) {
    Reflect.set(globalWithMocks, 'useRuntimeConfig', originalUseRuntimeConfig)
  }
  else {
    Reflect.deleteProperty(globalWithMocks, 'useRuntimeConfig')
  }

  if (originalCreateError) {
    Reflect.set(globalWithMocks, 'createError', originalCreateError)
  }
  else {
    Reflect.deleteProperty(globalWithMocks, 'createError')
  }
})

describe('server/utils/cloudinary', () => {
  it('resolves a trimmed cloudinary config and defaults folder when missing', () => {
    const config = resolveCloudinaryConfig({} as never)

    expect(config).toEqual({
      cloudName: 'demo-cloud',
      apiKey: 'key-123',
      apiSecret: 'secret-xyz',
      uploadFolder: 'questify/uploads',
    })
  })

  it('throws a 503 when required config is missing', async () => {
    (globalWithMocks.useRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue({ cloudinary: {} })

    await expect(async () => resolveCloudinaryConfig({} as never)).rejects.toMatchObject({ status: 503 })
  })

  it('signs params by filtering empty values, sorting keys, and hashing', () => {
    const signature = signCloudinaryParams(
      { folder: 'questify/uploads', timestamp: 1700000000, empty: '', nullish: null },
      'secret-xyz',
      'sha1',
    )

    expect(signature).toBe(
      signCloudinaryParams({ folder: 'questify/uploads', timestamp: 1700000000 }, 'secret-xyz', 'sha1'),
    )
    expect(signature).toMatch(/^[a-f0-9]{40}$/)
  })
})
