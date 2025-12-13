import { beforeEach, describe, expect, it } from 'vitest'
import { getModelPersonaTelemetry, recordModelPersonaEvent } from '../../../server/utils/persona-telemetry'

const TELEMETRY_KEY = Symbol.for('questify.telemetry.modelPersonas')

describe('server/utils/persona-telemetry', () => {
  beforeEach(() => {
    const globalStore = globalThis as typeof globalThis & { [key: symbol]: unknown }
    delete globalStore[TELEMETRY_KEY]
  })

  it('tracks totals and dimension buckets', () => {
    recordModelPersonaEvent('model_persona_selected', {
      personaKey: 'swift-scout',
      surface: 'quest-create',
      environment: 'test',
    })
    recordModelPersonaEvent('model_persona_selected', {
      personaKey: 'swift-scout',
      surface: 'quest-create',
      environment: 'test',
    })
    recordModelPersonaEvent('model_persona_hovered', {
      personaKey: 'balanced-navigator',
      surface: 'quest-edit',
      environment: 'prod',
    })
    recordModelPersonaEvent('model_persona_viewed', {
      personaKey: '',
      surface: 'quest-create',
    })

    const telemetry = getModelPersonaTelemetry()

    expect(telemetry.model_persona_selected.total).toBe(2)
    expect(telemetry.model_persona_selected.byPersona).toEqual({ 'swift-scout': 2 })
    expect(telemetry.model_persona_selected.bySurface).toEqual({ 'quest-create': 2 })
    expect(telemetry.model_persona_selected.byEnvironment).toEqual({ test: 2 })

    expect(telemetry.model_persona_hovered.total).toBe(1)
    expect(telemetry.model_persona_hovered.byPersona).toEqual({ 'balanced-navigator': 1 })
    expect(telemetry.model_persona_hovered.bySurface).toEqual({ 'quest-edit': 1 })
    expect(telemetry.model_persona_hovered.byEnvironment).toEqual({ prod: 1 })

    expect(telemetry.model_persona_viewed.total).toBe(1)
    expect(telemetry.model_persona_viewed.byPersona).toEqual({})
  })

  it('returns a copy to avoid external mutation', () => {
    recordModelPersonaEvent('model_persona_selected', {
      personaKey: 'sentinel-strategist',
      surface: 'quest-create',
      environment: 'test',
    })

    const snapshot = getModelPersonaTelemetry()
    snapshot.model_persona_selected.total = 99
    snapshot.model_persona_selected.byPersona['sentinel-strategist'] = 99

    const fresh = getModelPersonaTelemetry()
    expect(fresh.model_persona_selected.total).toBe(1)
    expect(fresh.model_persona_selected.byPersona).toEqual({ 'sentinel-strategist': 1 })
  })
})
