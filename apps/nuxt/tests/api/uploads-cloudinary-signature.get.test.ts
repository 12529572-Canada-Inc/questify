import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/uploads/cloudinary-signature.get'

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
}

const resolveCloudinaryConfigMock = vi.hoisted(() => vi.fn())
const signCloudinaryParamsMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/cloudinary', () => ({
  resolveCloudinaryConfig: resolveCloudinaryConfigMock,
  signCloudinaryParams: signCloudinaryParamsMock,
}))

const globalWithMocks = globalThis as GlobalWithMocks
const originalRequireUserSession = globalWithMocks.requireUserSession

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-06-01T12:00:00Z'))

  resolveCloudinaryConfigMock.mockReset()
  signCloudinaryParamsMock.mockReset()

  resolveCloudinaryConfigMock.mockReturnValue({
    cloudName: 'demo-cloud',
    apiKey: 'api-key-123',
    apiSecret: 'secret-xyz',
    uploadFolder: 'questify/uploads',
  })
  signCloudinaryParamsMock.mockReturnValue('signed-payload')

  Reflect.set(globalWithMocks, 'requireUserSession', vi.fn(async () => ({
    user: { id: 'user-42' },
  })))
})

afterEach(() => {
  vi.useRealTimers()

  if (originalRequireUserSession) {
    Reflect.set(globalWithMocks, 'requireUserSession', originalRequireUserSession)
  }
  else {
    Reflect.deleteProperty(globalWithMocks, 'requireUserSession')
  }
})

describe('API /api/uploads/cloudinary-signature (GET)', () => {
  it('returns a signed payload for the requesting user', async () => {
    const event = { path: '/api/uploads/cloudinary-signature' } as never
    const expectedTimestamp = Math.floor(Date.now() / 1000)

    const result = await handler(event)

    expect(resolveCloudinaryConfigMock).toHaveBeenCalledWith(event)
    expect(signCloudinaryParamsMock).toHaveBeenCalledWith(
      { folder: 'questify/uploads/user-42', timestamp: expectedTimestamp },
      'secret-xyz',
      'sha256',
    )
    expect(result).toEqual({
      cloudName: 'demo-cloud',
      apiKey: 'api-key-123',
      folder: 'questify/uploads/user-42',
      timestamp: expectedTimestamp,
      signatureAlgorithm: 'sha256',
      signature: 'signed-payload',
    })
  })
})
