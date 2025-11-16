import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/support/assistant.post'

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>
type ReadBodyMock = (event: unknown) => Promise<unknown>
type CreateErrorMock = (input: { status?: number, statusText?: string }) => Error
type UseRuntimeConfigMock = () => { features?: { aiAssist?: boolean } }

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
  readBody?: ReadBodyMock
  createError?: CreateErrorMock
  useRuntimeConfig?: UseRuntimeConfigMock
}

const runAiModelMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/ai-runner', () => ({
  runAiModel: runAiModelMock,
}))

const originalRequireUserSession = (globalThis as GlobalWithMocks).requireUserSession
const originalReadBody = (globalThis as GlobalWithMocks).readBody
const originalCreateError = (globalThis as GlobalWithMocks).createError
const originalUseRuntimeConfig = (globalThis as GlobalWithMocks).useRuntimeConfig

beforeEach(() => {
  runAiModelMock.mockReset()

  Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', vi.fn(async () => ({
    user: { id: 'user-id' },
  })))

  Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({
    question: 'How do I reset my password?',
    route: '/auth/login',
    conversation: [
      { role: 'user', content: 'Hi', route: '/auth/login' },
      { role: 'assistant', content: 'How can I help?' },
    ],
  })))

  Reflect.set(globalThis as GlobalWithMocks, 'createError', ({ status, statusText }) => {
    const error = new Error(statusText ?? 'Error') as Error & { status?: number }
    error.status = status
    return error
  })

  Reflect.set(globalThis as GlobalWithMocks, 'useRuntimeConfig', vi.fn(() => ({
    features: { aiAssist: true },
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
})

describe('API /api/support/assistant (POST)', () => {
  it('rejects when AI assistance is disabled', async () => {
    (globalThis as GlobalWithMocks).useRuntimeConfig = vi.fn(() => ({
      features: { aiAssist: false },
    }))

    await expect(handler({} as never)).rejects.toMatchObject({ status: 404 })
    expect(runAiModelMock).not.toHaveBeenCalled()
  })

  it('returns an assistant response and builds prompt with history', async () => {
    runAiModelMock.mockResolvedValue({
      modelId: 'gpt-4o-mini',
      content: 'Reset your password from the login page using "Forgot password".',
    })

    const response = await handler({} as never)

    expect(runAiModelMock).toHaveBeenCalledTimes(1)
    const prompt = runAiModelMock.mock.calls[0]?.[0]
    expect(prompt).toContain('Current page: /auth/login')
    expect(prompt).toContain('Conversation so far')
    expect(prompt).toContain('Hi')
    expect(prompt).toContain('How do I reset my password')

    expect(response.success).toBe(true)
    expect(response.answer).toContain('Reset your password')
    expect(response.messageId).toBeTruthy()
    expect(response.createdAt).toBeTruthy()
  })

  it('validates the question is required', async () => {
    (globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({
      question: '   ',
    }))

    await expect(handler({} as never)).rejects.toMatchObject({ status: 400 })
    expect(runAiModelMock).not.toHaveBeenCalled()
  })

  it('bubbles empty provider responses as a 502', async () => {
    runAiModelMock.mockResolvedValue({
      modelId: 'gpt-4o-mini',
      content: '   ',
    })

    await expect(handler({} as never)).rejects.toMatchObject({ status: 502 })
  })

  it('trims history to the latest entries and falls back to unknown route', async () => {
    (globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({
      question: 'Help me',
      route: '   ',
      conversation: [
        { role: 'user', content: 'skip-me-0' },
        { role: 'assistant', content: 'skip-me-1' },
        { role: 'user', content: 'msg-2' },
        { role: 'assistant', content: 'msg-3' },
        { role: 'user', content: 'msg-4' },
        { role: 'assistant', content: 'msg-5' },
        { role: 'user', content: 'msg-6' },
        { role: 'assistant', content: 'msg-7' },
        { role: 'user', content: 'msg-8' },
        { role: 'assistant', content: 'msg-9' },
      ],
    }))

    runAiModelMock.mockResolvedValue({
      modelId: 'gpt-4o-mini',
      content: 'All good',
    })

    const response = await handler({} as never)

    expect(response.success).toBe(true)
    const prompt = runAiModelMock.mock.calls[0]?.[0]
    expect(prompt).toContain('Current page: Unknown')
    expect(prompt).not.toContain('skip-me-0')
    expect(prompt).not.toContain('skip-me-1')
    expect(prompt).toContain('msg-2')
    expect(prompt).toContain('msg-9')
  })

  it('includes html snapshot when provided', async () => {
    const htmlSnapshot = '<html><body><div>Support content</div></body></html>'
    ;(globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({
      question: 'Page help please',
      route: '/quests',
      conversation: [],
      htmlSnapshot,
    }))

    runAiModelMock.mockResolvedValue({
      modelId: 'gpt-4o-mini',
      content: 'All good',
    })

    await handler({} as never)

    const prompt = runAiModelMock.mock.calls[0]?.[0]
    expect(prompt).toContain('Current page HTML snapshot')
    expect(prompt).toContain('Support content')
  })
})
