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
  htmlSnapshot?: string
  visibleText?: string
}

const MAX_ROUTE_LENGTH = 240
const MAX_QUESTION_LENGTH = 800
const MAX_MESSAGE_LENGTH = 800
const MAX_HISTORY = 8
const MAX_VISIBLE_TEXT_LENGTH = 10_000

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

function sanitizeVisibleText(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) {
    return null
  }
  return trimmed.slice(0, MAX_VISIBLE_TEXT_LENGTH)
}

function buildPrompt(question: string, route: string, history: SupportChatMessage[], htmlSnapshot?: string | null, visibleText?: string | null) {
  const lines = [
    'You are Questify\'s in-app AI assistant, providing concise, step-by-step guidance.',
    'When answering:',
    '• Keep it under ~140 words and avoid generic platitudes.',
    '• Ground responses in the provided page context and conversation.',
    '• If uncertain, say what is missing and ask a clarifying question.',
  ]

  lines.push('', 'Page context:')
  lines.push(`• Route: ${route || 'Unknown'}`)
  if (visibleText) {
    lines.push(`• Visible text (trimmed): ${visibleText}`)
  }
  if (history.length) {
    lines.push('', 'Conversation so far:')
    for (const message of history) {
      const speaker = message.role === 'assistant' ? 'Assistant' : 'User'
      lines.push(`${speaker}: ${message.content}`)
    }
  }

  if (htmlSnapshot) {
    lines.push('', 'HTML snapshot (truncated):', htmlSnapshot.slice(0, 2000))
  }

  lines.push(
    '',
    `User question: ${question}`,
    'Provide a clear, page-aware answer with 2-4 actionable steps when relevant. If out of scope, say so briefly and suggest contacting support.',
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
  const htmlSnapshot = typeof body.htmlSnapshot === 'string' ? body.htmlSnapshot.slice(0, 100_000) : null
  const visibleText = sanitizeVisibleText(body.visibleText)
  const prompt = buildPrompt(question, route, history, htmlSnapshot, visibleText)

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
