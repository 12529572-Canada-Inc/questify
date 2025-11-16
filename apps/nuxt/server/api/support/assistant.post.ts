import { runAiModel } from '../../utils/ai-runner'

type SupportChatRole = 'user' | 'assistant'

type SupportChatMessage = {
  role: SupportChatRole
  content: string
  route?: string
}

type SupportAssistantBody = {
  question?: string
  route?: string
  conversation?: SupportChatMessage[]
  modelType?: string | null
}

const MAX_ROUTE_LENGTH = 240
const MAX_QUESTION_LENGTH = 800
const MAX_MESSAGE_LENGTH = 800
const MAX_HISTORY = 8

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `msg-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
}

function sanitizeQuestion(value: unknown) {
  if (typeof value !== 'string') {
    throw createError({ status: 400, statusText: 'A question is required.' })
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw createError({ status: 400, statusText: 'A question is required.' })
  }
  return trimmed.slice(0, MAX_QUESTION_LENGTH)
}

function sanitizeRoute(route: unknown) {
  if (typeof route !== 'string') {
    return 'Unknown'
  }
  const trimmed = route.trim()
  if (!trimmed) {
    return 'Unknown'
  }
  return trimmed.slice(0, MAX_ROUTE_LENGTH)
}

function sanitizeMessage(entry: unknown): SupportChatMessage | null {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const role = 'role' in entry && (entry as { role?: string }).role
  const content = 'content' in entry && (entry as { content?: string }).content
  const route = 'route' in entry && (entry as { route?: string }).route

  const normalizedRole = role === 'assistant' || role === 'user' ? role : null
  const normalizedContent = typeof content === 'string' ? content.trim().slice(0, MAX_MESSAGE_LENGTH) : ''
  const normalizedRoute = typeof route === 'string' ? route.trim().slice(0, MAX_ROUTE_LENGTH) : undefined

  if (!normalizedRole || !normalizedContent) {
    return null
  }

  return {
    role: normalizedRole,
    content: normalizedContent,
    route: normalizedRoute,
  }
}

function sanitizeConversation(value: unknown): SupportChatMessage[] {
  if (!Array.isArray(value)) {
    return []
  }

  const sanitized = value
    .map(entry => sanitizeMessage(entry))
    .filter((item): item is SupportChatMessage => Boolean(item))

  return sanitized.slice(-MAX_HISTORY)
}

function buildPrompt(question: string, route: string, history: SupportChatMessage[]) {
  const lines = [
    'You are Questify\'s in-app AI assistant, providing concise, step-by-step guidance.',
    `Current page: ${route || 'Unknown'}. Tailor the answer to this page when possible.`,
    'Keep responses short (under 140 words), and avoid fabricating product behavior.',
    `Finish with a follow-up question to engage the user.`,
  ]

  if (history.length) {
    lines.push('', 'Conversation so far:')
    for (const message of history) {
      const speaker = message.role === 'assistant' ? 'Assistant' : 'User'
      lines.push(`${speaker}: ${message.content}`)
    }
  }

  lines.push(
    '',
    `User question: ${question}`,
    'Provide a clear answer. If the user asks something out of scope, give a brief safe response and suggest contacting support.',
  )

  return lines.join('\n')
}

const handler = defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const featureEnabled = Boolean(config.features?.aiAssist)
  if (!featureEnabled) {
    throw createError({ status: 404, statusText: 'AI assistance is disabled.' })
  }

  await requireUserSession(event)

  const body = await readBody<SupportAssistantBody>(event) ?? {}
  const question = sanitizeQuestion(body.question)
  const route = sanitizeRoute(body.route)
  const history = sanitizeConversation(body.conversation)
  const requestedModel = typeof body.modelType === 'string' ? body.modelType : null
  const prompt = buildPrompt(question, route, history)

  try {
    const { content, modelId } = await runAiModel(prompt, requestedModel)
    const answer = (content || '').trim()
    if (!answer) {
      throw new Error('Empty response from AI model')
    }

    return {
      success: true,
      answer,
      modelId,
      messageId: createMessageId(),
      createdAt: new Date().toISOString(),
    }
  }
  catch (error) {
    console.error('Support assistant error:', error)

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
      statusText: 'Failed to generate an assistant response. Please try again shortly.',
    })
  }
})

export default handler

export type SupportAssistantResponse = Awaited<ReturnType<typeof handler>>
