type PersonaTelemetryEvent =
  | 'model_persona_viewed'
  | 'model_persona_hovered'
  | 'model_persona_selected'
  | 'model_persona_recommended_shown'
  | 'model_persona_recommended_accepted'

export type PersonaTelemetryAttributes = {
  personaKey: string
  provider?: string
  modelId?: string
  surface?: string
  environment?: string
}

type PersonaEventStats = {
  total: number
  byPersona: Record<string, number>
  bySurface: Record<string, number>
  byEnvironment: Record<string, number>
}

type PersonaTelemetryStore = Record<PersonaTelemetryEvent, PersonaEventStats>

const GLOBAL_KEY = Symbol.for('questify.telemetry.modelPersonas')

function getStore(): PersonaTelemetryStore {
  const globalStore = globalThis as typeof globalThis & { [GLOBAL_KEY]?: PersonaTelemetryStore }
  if (!globalStore[GLOBAL_KEY]) {
    globalStore[GLOBAL_KEY] = {
      model_persona_viewed: { total: 0, byPersona: {}, bySurface: {}, byEnvironment: {} },
      model_persona_hovered: { total: 0, byPersona: {}, bySurface: {}, byEnvironment: {} },
      model_persona_selected: { total: 0, byPersona: {}, bySurface: {}, byEnvironment: {} },
      model_persona_recommended_shown: { total: 0, byPersona: {}, bySurface: {}, byEnvironment: {} },
      model_persona_recommended_accepted: { total: 0, byPersona: {}, bySurface: {}, byEnvironment: {} },
    }
  }
  return globalStore[GLOBAL_KEY]!
}

export function recordModelPersonaEvent(event: PersonaTelemetryEvent, attrs: PersonaTelemetryAttributes) {
  const store = getStore()
  const bucket = store[event]

  bucket.total += 1
  if (attrs.personaKey) {
    const key = attrs.personaKey
    bucket.byPersona[key] = (bucket.byPersona[key] ?? 0) + 1
  }
  if (attrs.surface) {
    const surfaceKey = attrs.surface
    bucket.bySurface[surfaceKey] = (bucket.bySurface[surfaceKey] ?? 0) + 1
  }
  if (attrs.environment) {
    const environmentKey = attrs.environment
    bucket.byEnvironment[environmentKey] = (bucket.byEnvironment[environmentKey] ?? 0) + 1
  }
}

export function getModelPersonaTelemetry(): PersonaTelemetryStore {
  const store = getStore()
  return {
    model_persona_viewed: {
      total: store.model_persona_viewed.total,
      byPersona: { ...store.model_persona_viewed.byPersona },
      bySurface: { ...store.model_persona_viewed.bySurface },
      byEnvironment: { ...store.model_persona_viewed.byEnvironment },
    },
    model_persona_hovered: {
      total: store.model_persona_hovered.total,
      byPersona: { ...store.model_persona_hovered.byPersona },
      bySurface: { ...store.model_persona_hovered.bySurface },
      byEnvironment: { ...store.model_persona_hovered.byEnvironment },
    },
    model_persona_selected: {
      total: store.model_persona_selected.total,
      byPersona: { ...store.model_persona_selected.byPersona },
      bySurface: { ...store.model_persona_selected.bySurface },
      byEnvironment: { ...store.model_persona_selected.byEnvironment },
    },
    model_persona_recommended_shown: {
      total: store.model_persona_recommended_shown.total,
      byPersona: { ...store.model_persona_recommended_shown.byPersona },
      bySurface: { ...store.model_persona_recommended_shown.bySurface },
      byEnvironment: { ...store.model_persona_recommended_shown.byEnvironment },
    },
    model_persona_recommended_accepted: {
      total: store.model_persona_recommended_accepted.total,
      byPersona: { ...store.model_persona_recommended_accepted.byPersona },
      bySurface: { ...store.model_persona_recommended_accepted.bySurface },
      byEnvironment: { ...store.model_persona_recommended_accepted.byEnvironment },
    },
  }
}
