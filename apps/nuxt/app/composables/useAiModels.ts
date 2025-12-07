import { computed } from 'vue'
import { DEFAULT_MODEL_ID, defaultAiModels, findModelOption, type AiModelOption } from 'shared/ai-models'

/**
 * Exposes the AI models defined in runtime config (or the defaults) along with
 * helpers for resolving the preferred/default model or looking up a model by id.
 *
 * @returns reactive `models`, `defaultModel`, and `findModelById` utilities.
 */

export function useAiModels() {
  const runtimeConfig = useRuntimeConfig()

  const configuredModels = runtimeConfig.public.aiModels as AiModelOption[] | undefined
  const configuredDefaultId = runtimeConfig.public.aiModelDefaultId as string | undefined

  const models = computed<AiModelOption[]>(() => {
    const source = Array.isArray(configuredModels) && configuredModels.length > 0
      ? configuredModels
      : defaultAiModels
    return source.map(model => ({
      ...model,
      enabled: model.enabled !== false,
    }))
  })

  const enabledModels = computed(() => models.value.filter(model => model.enabled !== false))

  const defaultModel = computed(() => {
    if (!enabledModels.value.length) return null
    const preferredId = configuredDefaultId ?? DEFAULT_MODEL_ID
    return findModelOption(enabledModels.value, preferredId) ?? enabledModels.value[0]
  })

  function findModelById(id?: string | null) {
    if (!enabledModels.value.length) return null
    if (id && id.trim().length > 0) {
      const match = findModelOption(enabledModels.value, id.trim())
      if (match) return match
    }
    return defaultModel.value ?? enabledModels.value[0]
  }

  return {
    models,
    enabledModels,
    defaultModel,
    findModelById,
  }
}
