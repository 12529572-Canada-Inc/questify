import { computed } from 'vue'
import { DEFAULT_MODEL_ID, defaultAiModels, findModelOption, type AiModelOption } from 'shared/ai-models'

/**
 * Exposes the list of AI models configured for the client along with helpers
 * to resolve the default model or look up a model by id based on runtime config.
 */

export function useAiModels() {
  const runtimeConfig = useRuntimeConfig()

  const configuredModels = runtimeConfig.public.aiModels as AiModelOption[] | undefined
  const configuredDefaultId = runtimeConfig.public.aiModelDefaultId as string | undefined

  const models = computed<AiModelOption[]>(() => {
    return Array.isArray(configuredModels) && configuredModels.length > 0
      ? configuredModels
      : defaultAiModels
  })

  const defaultModel = computed(() => {
    if (!models.value.length) return null
    const preferredId = configuredDefaultId ?? DEFAULT_MODEL_ID
    return findModelOption(models.value, preferredId) ?? models.value[0]
  })

  function findModelById(id?: string | null) {
    if (!models.value.length) return null
    if (id && id.trim().length > 0) {
      const match = findModelOption(models.value, id.trim())
      if (match) return match
    }
    return defaultModel.value ?? models.value[0]
  }

  return {
    models,
    defaultModel,
    findModelById,
  }
}
