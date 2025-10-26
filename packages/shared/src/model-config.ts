import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { DEFAULT_MODEL_ID, defaultAiModels, sanitizeModelOptions, type AiModelOption } from './ai-models'

type LoadOptions = {
  env?: NodeJS.ProcessEnv
  jsonOverride?: string | null
  fileOverride?: string | null
}

export type ModelConfigResult = {
  models: AiModelOption[]
  defaultModelId: string
  source: 'env-json' | 'file' | 'default'
}

function parseJsonConfig(raw: string | null | undefined): AiModelOption[] | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed) as AiModelOption[] | { models?: AiModelOption[] }
    if (Array.isArray(parsed)) {
      return parsed
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.models)) {
      return parsed.models
    }
  }
  catch (error) {
    console.warn('Failed to parse AI model config JSON override:', error)
  }
  return null
}

function readConfigFile(filePath: string | null | undefined): AiModelOption[] | null {
  if (!filePath) return null
  const trimmed = filePath.trim()
  if (!trimmed) return null

  const resolvedPath = trimmed.startsWith('file:')
    ? url.fileURLToPath(trimmed)
    : path.isAbsolute(trimmed)
      ? trimmed
      : path.resolve(process.cwd(), trimmed)

  try {
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`AI model config file not found at ${resolvedPath}`)
      return null
    }
    const contents = fs.readFileSync(resolvedPath, 'utf8')
    return parseJsonConfig(contents)
  }
  catch (error) {
    console.warn(`Failed to read AI model config file at ${resolvedPath}:`, error)
    return null
  }
}

export function loadModelConfig(options: LoadOptions = {}): ModelConfigResult {
  const env = options.env ?? process.env
  const jsonOverride = options.jsonOverride ?? env.AI_MODEL_CONFIG_JSON ?? env.AI_MODEL_CONFIG ?? null
  const fileOverride = options.fileOverride ?? env.AI_MODEL_CONFIG_PATH ?? null

  const fromJson = parseJsonConfig(jsonOverride)
  const fromFile = fromJson ? null : readConfigFile(fileOverride)

  const models = sanitizeModelOptions(fromJson ?? fromFile ?? defaultAiModels)
  const defaultModelId = models.find(model => model.default)?.id ?? models[0]?.id ?? DEFAULT_MODEL_ID

  return {
    models,
    defaultModelId,
    source: fromJson ? 'env-json' : fromFile ? 'file' : 'default',
  }
}
