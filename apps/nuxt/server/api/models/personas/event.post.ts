import { recordModelPersonaEvent, type PersonaTelemetryAttributes } from '../../../utils/persona-telemetry'

const allowedEventNames = [
  'model_persona_viewed',
  'model_persona_hovered',
  'model_persona_selected',
  'model_persona_recommended_shown',
  'model_persona_recommended_accepted',
] as const

type PersonaEventName = typeof allowedEventNames[number]

const allowedEvents = new Set<PersonaEventName>(allowedEventNames)

function isPersonaEventName(value: string): value is PersonaEventName {
  return allowedEvents.has(value as PersonaEventName)
}

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

  if (!eventName || !isPersonaEventName(eventName)) {
    throw createError({
      status: 400,
      statusText: 'Invalid persona event',
    })
  }

  const attrs = (body?.attributes ?? {}) as Partial<PersonaTelemetryAttributes>
  const personaKey = typeof attrs.personaKey === 'string' ? attrs.personaKey.trim() : ''

  if (!personaKey) {
    throw createError({
      status: 400,
      statusText: 'Missing persona key',
    })
  }

  recordModelPersonaEvent(eventName, {
    personaKey,
    provider: attrs.provider,
    modelId: attrs.modelId,
    surface: attrs.surface,
    environment: attrs.environment,
  })

  return { success: true }
})
