import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGithubIssue } from '../../../server/utils/github'

type UseRuntimeConfigMock = () => { github?: { owner?: string, repo?: string, token?: string } }
type FetchMock = (input: unknown, init?: RequestInit) => Promise<{ ok: boolean, statusText?: string, text: () => Promise<string> }>
type CreateErrorMock = (input: { status?: number, statusText?: string }) => Error

type GlobalWithMocks = typeof globalThis & {
  useRuntimeConfig?: UseRuntimeConfigMock
  fetch?: FetchMock
  createError?: CreateErrorMock
}

const originalUseRuntimeConfig = (globalThis as GlobalWithMocks).useRuntimeConfig
const originalFetch = (globalThis as GlobalWithMocks).fetch
const originalCreateError = (globalThis as GlobalWithMocks).createError

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
    github: {
      owner: 'owner',
      repo: 'repo',
      token: 'token',
    },
  })))
  Reflect.set(globalThis as GlobalWithMocks, 'createError', ({ status, statusText }) => {
    const error = new Error(statusText ?? 'error') as Error & { statusCode?: number }
    error.statusCode = status ?? 500
    return error
  })
  Reflect.set(globalThis as GlobalWithMocks, 'fetch', fetchMock)
})

afterEach(() => {
  if (originalUseRuntimeConfig) Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', originalUseRuntimeConfig)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'useRuntimeConfig')

  if (originalFetch) Reflect.set(globalThis as GlobalWithMocks, 'fetch', originalFetch)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'fetch')

  if (originalCreateError) Reflect.set(globalThis as GlobalWithMocks, 'createError', originalCreateError)
  else Reflect.deleteProperty(globalThis as GlobalWithMocks, 'createError')
})

describe('server/utils/github', () => {
  it('throws with GitHub message when response is an error JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Bad Gateway',
      text: async () => JSON.stringify({ message: 'Missing scopes' }),
    })

    await expect(createGithubIssue({} as never, {
      title: 'Bug',
      body: 'Steps to repro',
    })).rejects.toMatchObject({ statusCode: 502 })
  })

  it('throws with raw body when response is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Bad Gateway',
      text: async () => 'not-json',
    })

    await expect(createGithubIssue({} as never, {
      title: 'Bug',
      body: 'Steps to repro',
    })).rejects.toMatchObject({ statusCode: 502, message: 'Bad Gateway' })
  })
})
