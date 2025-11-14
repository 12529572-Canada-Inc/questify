import { DEFAULT_MODEL_ID, defaultAiModels, findModelOption, resolveModelId, type AiModelOption } from 'shared/ai-models'

/**
 * Wraps access to AI model configuration to avoid duplicating runtime config parsing.
 */

function readConfiguredModels(): AiModelOption[] {
  const config = useRuntimeConfig()
  const models = config.aiModels as AiModelOption[] | undefined
  if (Array.isArray(models) && models.length > 0) {
    return models
  }
  return defaultAiModels
}

export function getAiModelOptions() {
  return readConfiguredModels()
}

export function getDefaultModelId() {
  const config = useRuntimeConfig()
  const explicit = config.aiModelDefaultId
  if (typeof explicit === 'string' && explicit.trim().length > 0) {
    return explicit.trim()
  }

  const models = readConfiguredModels()
  return models.find(model => model.default)?.id ?? models[0]?.id ?? DEFAULT_MODEL_ID
}

export function normalizeModelType(requested: unknown, fallback?: string | null) {
  const models = readConfiguredModels()
  const trimmed = typeof requested === 'string' ? requested.trim() : ''
  const fallbackId = typeof fallback === 'string' && fallback.trim().length > 0 ? fallback.trim() : undefined
  return resolveModelId(models, trimmed.length > 0 ? trimmed : fallbackId)
}

export function getModelMeta(modelId: string) {
  const models = readConfiguredModels()
  return findModelOption(models, modelId)
}
