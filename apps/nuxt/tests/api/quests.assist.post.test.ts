import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/quests/assist.post'

type RequireUserSessionMock = (event?: unknown) => Promise<{ user: { id: string } }>
type ReadBodyMock = (event: unknown) => Promise<unknown>
type CreateErrorMock = (input: { statusCode?: number, statusMessage?: string }) => Error
type UseRuntimeConfigMock = () => { features?: { aiAssist?: boolean } }

type GlobalWithMocks = typeof globalThis & {
  requireUserSession?: RequireUserSessionMock
  readBody?: ReadBodyMock
  createError?: CreateErrorMock
  useRuntimeConfig?: UseRuntimeConfigMock
}

const runAiModelMock = vi.fn()
const recordUsageMock = vi.fn()

vi.mock('../../server/utils/ai-runner', () => ({
  runAiModel: runAiModelMock,
}))

vi.mock('../../server/utils/telemetry', () => ({
  recordAiAssistUsage: recordUsageMock,
}))

const originalRequireUserSession = (globalThis as GlobalWithMocks).requireUserSession
const originalReadBody = (globalThis as GlobalWithMocks).readBody
const originalCreateError = (globalThis as GlobalWithMocks).createError
const originalUseRuntimeConfig = (globalThis as GlobalWithMocks).useRuntimeConfig

beforeEach(() => {
  runAiModelMock.mockReset()
  recordUsageMock.mockReset()

  Reflect.set(globalThis as GlobalWithMocks, 'requireUserSession', vi.fn(async () => ({
    user: { id: 'user-id' },
  })))

  Reflect.set(globalThis as GlobalWithMocks, 'readBody', vi.fn(async () => ({
    field: 'title',
    title: 'Launch product',
    goal: 'Ship MVP',
    context: 'Founders preparing launch',
    constraints: '2-week deadline',
    currentValue: 'New product launch',
    modelType: 'gpt-4o-mini',
  })))

  Reflect.set(globalThis as GlobalWithMocks, 'createError', ({ statusCode, statusMessage }) => {
    const error = new Error(statusMessage ?? 'Error') as Error & { statusCode?: number }
    error.statusCode = statusCode
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

describe('API /api/quests/assist (POST)', () => {
  it('rejects when feature flag is disabled', async () => {
    (globalThis as GlobalWithMocks).useRuntimeConfig = vi.fn(() => ({
      features: { aiAssist: false },
    }))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
    expect(runAiModelMock).not.toHaveBeenCalled()
  })

  it('returns suggestions from the AI provider', async () => {
    runAiModelMock.mockResolvedValue({
      modelId: 'gpt-4o-mini',
      content: JSON.stringify({
        suggestions: [
          { text: 'Launch Day Rally', rationale: 'Short, exciting phrasing.' },
          { text: 'Ship the MVP', rationale: 'Highlights the outcome.' },
        ],
      }),
    })

    const response = await handler({} as never)

    expect(runAiModelMock).toHaveBeenCalledTimes(1)
    expect(runAiModelMock.mock.calls[0][0]).toContain('Quest snapshot:')
    expect(response).toEqual({
      success: true,
      field: 'title',
      modelId: 'gpt-4o-mini',
      suggestions: [
        { text: 'Launch Day Rally', rationale: 'Short, exciting phrasing.' },
        { text: 'Ship the MVP', rationale: 'Highlights the outcome.' },
      ],
    })
    expect(recordUsageMock).toHaveBeenCalledWith('title')
  })

  it('bubbles parse errors as a 502', async () => {
    runAiModelMock.mockResolvedValue({
      modelId: 'gpt-4o-mini',
      content: 'not json',
    })

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('validates the requested field', async () => {
    (globalThis as GlobalWithMocks).readBody = vi.fn(async () => ({ field: 'summary' }))

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
    expect(runAiModelMock).not.toHaveBeenCalled()
  })
})

