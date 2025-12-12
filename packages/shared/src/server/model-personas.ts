import type { AiModelOption } from '../ai-models'
import {
  defaultModelPersonas,
  mergePersonasWithModels,
  sanitizeModelPersonas,
  type ModelPersona,
  type PersonaWithModel,
} from '../model-personas'
import { prisma } from './prisma'

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

export { mergePersonasWithModels }
