import type { AiModelOption } from 'shared/ai-models'
import { mergePersonasWithModels, loadModelPersonas } from 'shared/server'

export default defineEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()
  const rawModels = (runtimeConfig.aiModels ?? runtimeConfig.public.aiModels ?? []) as AiModelOption[]

  const personas = await loadModelPersonas()
  const personaOptions = mergePersonasWithModels(personas, rawModels)
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
