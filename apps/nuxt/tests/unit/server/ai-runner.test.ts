import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const openAiCreateMock = vi.fn()
const getAiModelOptionsMock = vi.fn()
const getDefaultModelIdMock = vi.fn()
const normalizeModelTypeMock = vi.fn()

vi.mock('openai', () => {
  class OpenAI {
    chat = { completions: { create: openAiCreateMock } }
  }
  return { default: OpenAI }
})

vi.mock('shared/ai-models', () => ({
  findModelOption: (options: Array<{ id: string }>, id: string) => options.find(option => option.id === id),
}))

vi.mock('../../../server/utils/model-options', () => ({
  getAiModelOptions: getAiModelOptionsMock,
  getDefaultModelId: getDefaultModelIdMock,
  normalizeModelType: normalizeModelTypeMock,
}))

const originalFetch = globalThis.fetch
const originalEnv = { ...process.env }

async function importRunner() {
  return import('../../../server/utils/ai-runner')
}

describe('server/utils/ai-runner', () => {
  beforeEach(() => {
    vi.resetModules()
    openAiCreateMock.mockReset()
    getAiModelOptionsMock.mockReset()
    getDefaultModelIdMock.mockReset()
    normalizeModelTypeMock.mockReset()
    process.env = { ...originalEnv }
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    globalThis.fetch = originalFetch
  })

  it('invokes OpenAI models with optional images', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
    getAiModelOptionsMock.mockReturnValue([{
      id: 'gpt-4o-mini',
      provider: 'openai',
      apiModel: 'gpt-4o-mini',
      label: 'OpenAI',
      providerLabel: 'OpenAI',
      description: '',
      tags: [],
      default: true,
    }])
    getDefaultModelIdMock.mockReturnValue('gpt-4o-mini')
    normalizeModelTypeMock.mockImplementation((requested, fallback) => requested ?? fallback)
    openAiCreateMock.mockResolvedValue({
      choices: [{ message: { content: 'hello world' } }],
    })

    const { runAiModel } = await importRunner()
    const result = await runAiModel('Prompt text', 'gpt-4o-mini', true, ['https://example.com/img.png'])

    expect(openAiCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
      messages: [expect.objectContaining({ content: expect.any(Array) })],
    }))
    expect(result).toEqual({ content: 'hello world', modelId: 'gpt-4o-mini' })
  })

  it('calls anthropic and returns parsed text content', async () => {
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'
    getAiModelOptionsMock.mockReturnValue([{
      id: 'claude-3.5-sonnet',
      provider: 'anthropic',
      apiModel: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet',
      providerLabel: 'Anthropic',
      description: '',
      tags: [],
      default: true,
    }])
    getDefaultModelIdMock.mockReturnValue('claude-3.5-sonnet')
    normalizeModelTypeMock.mockImplementation((requested, fallback) => requested ?? fallback)

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ content: [{ text: 'assistant output' }] }),
      text: async () => '',
    })) as unknown as typeof fetch
    globalThis.fetch = fetchMock

    const { runAiModel } = await importRunner()
    const result = await runAiModel('Anthropic prompt')

    expect(fetchMock).toHaveBeenCalled()
    expect(result).toEqual({ content: 'assistant output', modelId: 'claude-3.5-sonnet' })
  })
})
