import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/support/issues.post'

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string, name?: string | null, email?: string | null } }>
type ReadBodyMock = (event: unknown) => Promise<unknown>
type CreateErrorMock = (input: { status?: number, statusText?: string }) => Error
type UseRuntimeConfigMock = () => { github?: { owner?: string, repo?: string, token?: string } }
type FetchMock = (input: unknown, init?: RequestInit) => Promise<{ ok: boolean, text: () => Promise<string> }>

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
  readBody?: ReadBodyMock
  createError?: CreateErrorMock
  useRuntimeConfig?: UseRuntimeConfigMock
  fetch?: FetchMock
}

const originalRequireUserSession = (globalThis as GlobalWithMocks).requireUserSession
const originalReadBody = (globalThis as GlobalWithMocks).readBody
const originalCreateError = (globalThis as GlobalWithMocks).createError
const originalUseRuntimeConfig = (globalThis as GlobalWithMocks).useRuntimeConfig
const originalFetch = (globalThis as GlobalWithMocks).fetch

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify({
      number: 321,
      html_url: 'https://github.com/12529572-Canada-Inc/questify/issues/321',
      title: 'Example issue',
    }),
  })

  Reflect.set(globalThis as GlobalWithMocks, 'fetch', fetchMock)
  Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', vi.fn(async () => ({
    user: {
      id: 'user-123',
      name: 'Quest Seeker',
      email: 'quest@example.com',
    },
  })))
  Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({
    title: '  Example bug report ',
    category: 'Bug',
    description: 'Something is broken on this page.',
    route: '/quests/alpha',
    images: ['https://example.com/screenshot.png'],
  })))
  Reflect.set(globalThis as GlobalWithMocks, 'createError', ({ status, statusText }) => {
    const error = new Error(statusText ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = status ?? 500
    return error
  })
  Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
    github: {
      owner: '12529572-Canada-Inc',
      repo: 'questify',
      token: 'token-abc',
    },
  })))
})

afterEach(() => {
  if (originalRequireUserSession) Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', originalRequireUserSession)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'requireUserSession')

  if (originalReadBody) Reflect.set(globalThis as GlobalWithMocks, 'readBody', originalReadBody)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'readBody')

  if (originalCreateError) Reflect.set(globalThis as GlobalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'createError')

  if (originalUseRuntimeConfig) Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', originalUseRuntimeConfig)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'useRuntimeConfig')

  if (originalFetch) Reflect.set(globalThis as GlobalWithMocks, 'fetch', originalFetch)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'fetch')
})

describe('API /api/support/issues (POST)', () => {
  it('posts sanitized issue payloads to GitHub', async () => {
    const result = await handler({} as never)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const fetchArgs = fetchMock.mock.calls[0]!
    expect(fetchArgs[0]).toContain('/repos/12529572-Canada-Inc/questify/issues')

    const requestBody = JSON.parse((fetchArgs[1]?.body ?? '{}') as string)
    expect(requestBody).toMatchObject({
      title: 'Example bug report',
      labels: ['Bug'],
    })
    expect(typeof requestBody.body).toBe('string')
    expect(requestBody.body).toContain('**Category:** Bug')
    expect(requestBody.body).toContain('/quests/alpha')
    expect(requestBody.body).toContain('https://example.com/screenshot.png')

    expect(result).toEqual({
      success: true,
      issue: {
        number: 321,
        title: 'Example issue',
        url: 'https://github.com/12529572-Canada-Inc/questify/issues/321',
      },
    })
  })

  it('rejects submissions when GitHub is not configured', async () => {
    Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
      github: { owner: '', repo: '', token: '' },
    })))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 503 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects missing or invalid titles and categories', async () => {
    const baseBody = { description: 'Missing title', category: 'Bug', route: '/abc' }

    Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({ ...baseBody, title: undefined })))
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })

    Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({ ...baseBody, title: '   ' })))
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })

    Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({ ...baseBody, title: 'Valid', category: 'Other' })))
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('fills defaults when optional fields are omitted', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        number: 55,
        html_url: 'https://github.com/12529572-Canada-Inc/questify/issues/55',
        title: 'Valid',
      }),
    })

    Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({
      title: 'Valid',
      category: 'Bug',
    })))

    const result = await handler({} as never)

    const requestBody = JSON.parse((fetchMock.mock.calls[0]?.[1]?.body ?? '{}') as string)
    expect(requestBody.body).toContain('**Page:** Unknown')
    expect(requestBody.body).toContain('_No additional details provided._')
    expect(result.issue.number).toBe(55)
  })

  it('rejects invalid images', async () => {
    Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({
      title: 'Valid',
      category: 'Bug',
      images: ['http://insecure.example.com/img.png'],
    })))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
