export type AiProvider = 'openai' | 'anthropic' | 'deepseek'

export type AiModelOption = {
  /**
   * Identifier stored in the database and sent from the UI.
   */
  id: string
  /**
   * Human readable name (e.g., "GPT-4o mini").
   */
  label: string
  /**
   * Provider identifier used for routing API calls.
   */
  provider: AiProvider
  /**
   * Human readable provider label (e.g., "OpenAI").
   */
  providerLabel: string
  /**
   * Short sentence describing when to use the model. Displayed in tooltips.
   */
  description: string
  /**
   * Visual tags shown in the UI (e.g., "Fast", "Reasoning").
   */
  tags: string[]
  /**
   * Concrete model identifier expected by the upstream API.
   */
  apiModel: string
  /**
   * Flag the default model choice. Exactly one model should be default.
   */
  default?: boolean
}

export const DEFAULT_MODEL_ID = 'gpt-4o-mini'

export const defaultAiModels: AiModelOption[] = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Fast + budget friendly for everyday quest planning.',
    tags: ['Fast', 'Cost saver'],
    apiModel: 'gpt-4o-mini',
    default: true,
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Balanced quality with multimodal context support.',
    tags: ['Balanced', 'Multimodal'],
    apiModel: 'gpt-4o',
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Highest reasoning and creativity for complex quests.',
    tags: ['Reasoning', 'Creative'],
    apiModel: 'gpt-5',
  },
  {
    id: 'claude-3-sonnet',
    label: 'Claude 3 Sonnet',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    description: 'Polished writing style with excellent context retention.',
    tags: ['Writing', 'Balanced'],
    apiModel: 'claude-3-sonnet-20240229',
  },
  {
    id: 'claude-3-opus',
    label: 'Claude 3 Opus',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    description: 'Premium reasoning depth for strategic investigations.',
    tags: ['Reasoning', 'Premium'],
    apiModel: 'claude-3-opus-20240229',
  },
  {
    id: 'deepseek-chat',
    label: 'DeepSeek Chat',
    provider: 'deepseek',
    providerLabel: 'DeepSeek',
    description: 'High speed conversational model with solid analysis.',
    tags: ['Fast', 'Conversational'],
    apiModel: 'deepseek-chat',
  },
  {
    id: 'deepseek-coder',
    label: 'DeepSeek Coder',
    provider: 'deepseek',
    providerLabel: 'DeepSeek',
    description: 'Optimized for technical breakdowns and coding steps.',
    tags: ['Technical', 'Coding'],
    apiModel: 'deepseek-coder',
  },
]

export function sanitizeModelOptions(models: AiModelOption[] | null | undefined): AiModelOption[] {
  const seen = new Set<string>()
  const sanitized: AiModelOption[] = []

  for (const model of models ?? []) {
    if (!model || typeof model !== 'object') continue
    if (typeof model.id !== 'string' || model.id.trim().length === 0) continue
    const id = model.id.trim()
    if (seen.has(id)) continue

    sanitized.push({
      ...model,
      id,
      label: typeof model.label === 'string' && model.label.trim().length > 0
        ? model.label.trim()
        : id,
      provider: model.provider,
      providerLabel: typeof model.providerLabel === 'string' && model.providerLabel.trim().length > 0
        ? model.providerLabel.trim()
        : model.provider,
      description: typeof model.description === 'string' && model.description.trim().length > 0
        ? model.description.trim()
        : '',
      tags: Array.isArray(model.tags)
        ? model.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).map(tag => tag.trim())
        : [],
      apiModel: typeof model.apiModel === 'string' && model.apiModel.trim().length > 0
        ? model.apiModel.trim()
        : id,
      default: Boolean(model.default),
    })
    seen.add(id)
  }

  if (sanitized.length === 0) {
    return [...defaultAiModels]
  }

  if (!sanitized.some(model => model.default)) {
    const fallback = sanitized.find(model => model.id === DEFAULT_MODEL_ID)
    if (fallback) {
      fallback.default = true
    }
    else {
      const firstModel = sanitized[0]
      if (firstModel) {
        firstModel.default = true
      }
    }
  }

  return sanitized
}

export function findModelOption(models: AiModelOption[], id?: string | null) {
  return models.find(model => model.id === id) ?? null
}

export function resolveModelId(models: AiModelOption[], id?: string | null) {
  const match = findModelOption(models, id)
  if (match) {
    return match.id
  }

  const defaultModel = models.find(model => model.default) ?? models[0]
  return defaultModel?.id ?? DEFAULT_MODEL_ID
}
