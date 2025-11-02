import OpenAI from 'openai'
import { findModelOption, type AiModelOption } from 'shared/ai-models'
import { getAiModelOptions, getDefaultModelId, normalizeModelType } from './model-options'

const openaiApiKey = process.env.OPENAI_API_KEY || ''
const deepseekApiKey = process.env.DEEPSEEK_API_KEY || ''
const deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
const anthropicApiVersion = process.env.ANTHROPIC_API_VERSION || '2023-06-01'

const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null
const deepseekClient = deepseekApiKey
  ? new OpenAI({
      apiKey: deepseekApiKey,
      baseURL: deepseekBaseUrl,
    })
  : null

type RunModelResult = {
  content: string
  modelId: string
}

function resolveModelOption(requested?: string | null): AiModelOption {
  const defaultModelId = getDefaultModelId()
  const normalizedId = normalizeModelType(requested, defaultModelId)
  const options = getAiModelOptions()
  return findModelOption(options, normalizedId) ?? options[0]
}

async function callOpenAi(client: OpenAI | null, model: AiModelOption, prompt: string) {
  if (!client) {
    throw new Error(`Missing API client for provider ${model.provider}`)
  }

  const response = await client.chat.completions.create({
    model: model.apiModel,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.choices[0]?.message?.content ?? ''
}

async function callAnthropic(model: AiModelOption, prompt: string) {
  if (!anthropicApiKey) {
    throw new Error('Missing API client for provider anthropic')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': anthropicApiVersion,
    },
    body: JSON.stringify({
      model: model.apiModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${errorText || response.statusText}`)
  }

  const payload = await response.json() as { content?: Array<{ text?: string }> }
  return (payload.content ?? [])
    .map(item => (typeof item.text === 'string' ? item.text : ''))
    .join('\n')
    .trim()
}

export async function runAiModel(prompt: string, requestedModelId?: string | null, allowFallback = true): Promise<RunModelResult> {
  const model = resolveModelOption(requestedModelId)
  const defaultModelId = getDefaultModelId()

  try {
    let content = ''
    if (model.provider === 'openai') {
      content = await callOpenAi(openaiClient, model, prompt)
    }
    else if (model.provider === 'deepseek') {
      content = await callOpenAi(deepseekClient, model, prompt)
    }
    else {
      content = await callAnthropic(model, prompt)
    }

    return { content, modelId: model.id }
  }
  catch (error) {
    if (allowFallback && model.id !== defaultModelId) {
      console.warn(`Model ${model.id} failed (${(error as Error).message}); falling back to ${defaultModelId}`)
      return runAiModel(prompt, defaultModelId, false)
    }
    throw error
  }
}
