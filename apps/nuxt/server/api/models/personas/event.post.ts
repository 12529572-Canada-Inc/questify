import { recordModelPersonaEvent, type PersonaTelemetryAttributes } from '~/server/utils/persona-telemetry'

const allowedEvents = new Set([
  'model_persona_viewed',
  'model_persona_hovered',
  'model_persona_selected',
  'model_persona_recommended_shown',
  'model_persona_recommended_accepted',
])

type PersonaEventBody = {
  event?: string
  attributes?: PersonaTelemetryAttributes
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const featureEnabled = Boolean(runtimeConfig.public.features?.modelPersonas)

  if (!featureEnabled) {
    return { success: true, skipped: true }
  }

  const body = await readBody<PersonaEventBody>(event).catch(() => null)
  const eventName = body?.event

  if (!eventName || !allowedEvents.has(eventName)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid persona event',
    })
  }

  const attrs = body?.attributes ?? {}
  if (!attrs.personaKey || typeof attrs.personaKey !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing persona key',
    })
  }

  recordModelPersonaEvent(eventName as any, {
    personaKey: attrs.personaKey.trim(),
    provider: attrs.provider,
    modelId: attrs.modelId,
    surface: attrs.surface,
    environment: attrs.environment,
  })

  return { success: true }
})
