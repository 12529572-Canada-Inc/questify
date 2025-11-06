import { parseJsonFromModel } from 'shared/server'
import { runAiModel } from '../../utils/ai-runner'
import { recordAiAssistUsage } from '../../utils/telemetry'

type AiAssistField = 'title' | 'goal' | 'context' | 'constraints'

type AiAssistRequestBody = {
  field?: string
  title?: string
  goal?: string
  context?: string
  constraints?: string
  currentValue?: string
  modelType?: string | null
}

type Suggestion = {
  text: string
  rationale?: string | null
}

type ParsedSuggestionPayload
  = | Suggestion[]
    | { suggestions?: Suggestion[] }

const FIELD_METADATA: Record<AiAssistField, { label: string, guidance: string }> = {
  title: {
    label: 'Title',
    guidance: 'Rewrite the quest title so it is short (6 words or fewer), motivational, and clearly communicates the intent.',
  },
  goal: {
    label: 'Goal',
    guidance: 'Help articulate a single measurable outcome or objective for this quest, written as a clear result statement.',
  },
  context: {
    label: 'Context',
    guidance: 'Summarize the important background details in one or two sentences, highlighting information that informs the plan.',
  },
  constraints: {
    label: 'Constraints',
    guidance: 'List at most three constraints, risks, deadlines, or preferences, each kept concise and actionable.',
  },
}

function sanitizeInput(value: unknown, maxLength = 800): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function buildPrompt(field: AiAssistField, payload: Required<Record<AiAssistField, string | null>>, currentValue: string | null) {
  const lines: string[] = [
    'You are assisting a user who is creating an epic quest inside a productivity app.',
    'Use the provided details to offer improvements for a single field of their quest.',
    '',
    'Quest snapshot:',
  ]

  if (payload.title) lines.push(`• Title: ${payload.title}`)
  if (payload.goal) lines.push(`• Goal: ${payload.goal}`)
  if (payload.context) lines.push(`• Context: ${payload.context}`)
  if (payload.constraints) lines.push(`• Constraints: ${payload.constraints}`)

  const { label, guidance } = FIELD_METADATA[field]
  lines.push(
    '',
    `Focus field: ${label}`,
    guidance,
    currentValue
      ? `Current user text: ${currentValue}`
      : 'The user left this field empty.',
    '',
    'Respond with JSON that matches the schema:',
    '{"suggestions":[{"text": string, "rationale": string}]}',
    'Provide between one and three suggestions. Keep each suggestion under 200 characters.',
  )

  return lines.join('\n')
}

function extractSuggestions(payload: ParsedSuggestionPayload): Suggestion[] {
  if (Array.isArray(payload)) {
    return payload
      .map(item => ({
        text: typeof item?.text === 'string' ? item.text.trim() : '',
        rationale: typeof item?.rationale === 'string' ? item.rationale.trim() : null,
      }))
      .filter(item => item.text.length > 0)
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.suggestions)) {
    return payload.suggestions
      .map(item => ({
        text: typeof item?.text === 'string' ? item.text.trim() : '',
        rationale: typeof item?.rationale === 'string' ? item.rationale.trim() : null,
      }))
      .filter(item => item.text.length > 0)
  }

  return []
}

const handler = defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const featureEnabled = Boolean(config.features?.aiAssist)
  if (!featureEnabled) {
    throw createError({ status: 404, statusText: 'AI assistance is disabled.' })
  }

  await requireUserSession(event)

  const body = (await readBody<AiAssistRequestBody>(event)) || {}
  const field = body.field?.toLowerCase() as AiAssistField | undefined
  if (!field || !(field in FIELD_METADATA)) {
    throw createError({ status: 400, statusText: 'Unsupported field for AI assistance.' })
  }

  const sanitized: Required<Record<AiAssistField, string | null>> = {
    title: sanitizeInput(body.title),
    goal: sanitizeInput(body.goal),
    context: sanitizeInput(body.context),
    constraints: sanitizeInput(body.constraints),
  }

  const currentValue = sanitizeInput(body.currentValue, 400)

  const prompt = buildPrompt(field, sanitized, currentValue)

  const requestedModelId = typeof body.modelType === 'string' ? body.modelType : null

  try {
    const { content, modelId } = await runAiModel(prompt, requestedModelId)
    const parsed = parseJsonFromModel<ParsedSuggestionPayload>(content)
    const suggestions = extractSuggestions(parsed)

    recordAiAssistUsage(field)

    return {
      success: true,
      field,
      modelId,
      suggestions,
    }
  }
  catch (error) {
    console.error('AI assistance error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Missing API client for provider')) {
        throw createError({
          status: 503,
          statusText: 'AI assistance is not configured for the selected model. Add the provider API key or choose a different model.',
        })
      }

      if (error.message.includes('No AI models configured')) {
        throw createError({
          status: 503,
          statusText: 'AI assistance is not available. Configure at least one AI model.',
        })
      }
    }

    throw createError({
      status: 502,
      statusText: 'Failed to generate AI suggestions. Please try again shortly.',
    })
  }
})

export default handler

export type QuestAiAssistResponse = Awaited<ReturnType<typeof handler>>
