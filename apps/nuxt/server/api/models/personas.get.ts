import { defaultAiModels, type AiModelOption } from 'shared/ai-models'
import { mergePersonasWithModels, loadModelPersonas } from 'shared/server'

export default defineEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()
  const rawModels = (runtimeConfig.aiModels ?? runtimeConfig.public.aiModels ?? []) as AiModelOption[]
  const models = Array.isArray(rawModels) && rawModels.length > 0 ? rawModels : defaultAiModels

  const personas = await loadModelPersonas()
  const personaOptions = mergePersonasWithModels(personas, models)
  const recommended = personaOptions.find(persona => persona.recommended && persona.enabled !== false)
    ?? personaOptions.find(persona => persona.enabled !== false)
    ?? personaOptions[0]

  return {
    featureEnabled: Boolean(runtimeConfig.public.features?.modelPersonas),
    variant: runtimeConfig.public.features?.modelPersonasVariant ?? 'control',
    personas: personaOptions,
    recommendedKey: recommended?.key ?? null,
  }
})
