import { computed } from 'vue'
import type { AiModelOption } from 'shared/ai-models'
import { defaultAiModels } from 'shared/ai-models'
import { mergePersonasWithModels, type PersonaWithModel } from 'shared/model-personas'

type PersonasResponse = {
  featureEnabled: boolean
  variant: string
  personas: PersonaWithModel[]
  recommendedKey: string | null
}

export function useModelPersonas() {
  const runtimeConfig = useRuntimeConfig()
  const configuredModels = runtimeConfig.public.aiModels as AiModelOption[] | undefined
  const featureEnabled = Boolean(runtimeConfig.public.features?.modelPersonas)
  const variant = runtimeConfig.public.features?.modelPersonasVariant ?? 'control'

  const models = computed<AiModelOption[]>(() =>
    (configuredModels && configuredModels.length > 0 ? configuredModels : defaultAiModels)
      .map(model => ({ ...model, enabled: model.enabled !== false })),
  )

  const { data, pending, error, refresh } = useAsyncData<PersonasResponse>('model-personas', async () => {
    const payload = await $fetch<PersonasResponse>('/api/models/personas').catch(() => null)
    if (payload?.personas?.length) {
      return payload
    }

    const fallbackPersonas = mergePersonasWithModels([], models.value)
    const recommended = fallbackPersonas.find(persona => persona.enabled !== false) ?? fallbackPersonas[0]
    return {
      featureEnabled,
      variant,
      personas: fallbackPersonas,
      recommendedKey: recommended?.key ?? null,
    }
  })

  const personas = computed(() => {
    const response = data.value
    if (response?.personas?.length) {
      return mergePersonasWithModels(response.personas, models.value)
    }
    return mergePersonasWithModels([], models.value)
  })

  const recommendedKey = computed(() => {
    const responseKey = data.value?.recommendedKey
    if (responseKey) {
      return responseKey
    }
    const recommended = personas.value.find(persona => persona.recommended && persona.enabled !== false)
      ?? personas.value.find(persona => persona.enabled !== false)
    return recommended?.key ?? null
  })

  return {
    personas,
    recommendedKey,
    featureEnabled,
    variant,
    loading: pending,
    error,
    refresh,
  }
}
