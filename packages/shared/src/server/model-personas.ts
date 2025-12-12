import type { AiModelOption } from '../ai-models'
import { defaultModelPersonas, sanitizeModelPersonas, type ModelPersona } from '../model-personas'
import { prisma } from './prisma'

export type PersonaWithModel = ModelPersona & {
  modelLabel?: string
  providerLabel?: string
  tags?: string[]
}

export async function loadModelPersonas(): Promise<ModelPersona[]> {
  try {
    const records = await prisma.modelPersona.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })

    if (!records.length) {
      return [...defaultModelPersonas]
    }

    return sanitizeModelPersonas(records.map(record => ({
      ...record,
      enabled: record.active,
    })))
  }
  catch (error) {
    console.warn('Failed to load model personas from the database; falling back to defaults.', error)
    return [...defaultModelPersonas]
  }
}

export function mergePersonasWithModels(personas: ModelPersona[], models: AiModelOption[]): PersonaWithModel[] {
  const personasByModel = new Map<string, PersonaWithModel>()
  const enabledModels = models.map(model => ({ ...model, enabled: model.enabled !== false }))

  for (const persona of sanitizeModelPersonas(personas)) {
    const model = enabledModels.find(item => item.id === persona.modelId)
    const disabledReason = persona.disabledReason
      ?? (!model ? 'Model not configured' : model.enabled === false ? 'Provider not configured' : null)

    personasByModel.set(persona.modelId, {
      ...persona,
      modelLabel: model?.label ?? persona.modelId,
      providerLabel: model?.providerLabel ?? persona.provider,
      tags: model?.tags ?? [],
      enabled: persona.active !== false && persona.enabled !== false && model?.enabled !== false,
      disabledReason,
    })
  }

  return enabledModels.map(model => {
    const persona = personasByModel.get(model.id)
    if (persona) {
      return persona
    }

    return {
      key: model.id,
      name: model.label,
      tagline: model.description,
      bestFor: [],
      speed: 'fast',
      cost: 'medium',
      contextLength: 'medium',
      provider: model.provider,
      modelId: model.id,
      modelLabel: model.label,
      providerLabel: model.providerLabel,
      tags: model.tags,
      enabled: model.enabled !== false,
      disabledReason: model.enabled === false ? 'Provider not configured' : null,
    }
  })
}
