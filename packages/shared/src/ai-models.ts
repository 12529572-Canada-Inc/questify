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
   * Flag indicating whether this model is available in the current deployment
   * (e.g., required API keys are present). Disabled models should not be selectable.
   */
  enabled?: boolean
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
    enabled: true,
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
    enabled: true,
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Highest reasoning and creativity for complex quests.',
    tags: ['Reasoning', 'Creative'],
    apiModel: 'gpt-4.1',
    enabled: true,
  },
  {
    id: 'gpt-5-mini',
    label: 'GPT-5 mini',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Next-gen GPT-5 speed tuned for quick drafts and fast tool calls.',
    tags: ['Fast', 'Next-gen'],
    apiModel: 'gpt-5-mini',
    enabled: true,
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Flagship GPT-5 model with balanced reasoning, creation, and multimodal context.',
    tags: ['Balanced', 'Multimodal'],
    apiModel: 'gpt-5',
    enabled: true,
  },
  {
    id: 'gpt-5-pro',
    label: 'GPT-5 Pro',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Longest-context, compliance-focused GPT-5 tuned for critical decisions.',
    tags: ['Premium', 'Long context'],
    apiModel: 'gpt-5-pro',
    enabled: true,
  },
  {
    id: 'claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    description: 'Polished writing style with excellent context retention.',
    tags: ['Writing', 'Balanced'],
    apiModel: 'claude-3-5-sonnet-20241022',
    enabled: true,
  },
  {
    id: 'claude-3.5-haiku',
    label: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    description: 'Fastest Anthropic model tuned for quick, concise replies.',
    tags: ['Fast', 'Cost saver'],
    apiModel: 'claude-3-5-haiku-20241022',
    enabled: true,
  },
  {
    id: 'claude-3-opus',
    label: 'Claude 3 Opus',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    description: 'Premium reasoning depth for strategic investigations.',
    tags: ['Reasoning', 'Premium'],
    apiModel: 'claude-3-opus-20240229',
    enabled: true,
  },
  {
    id: 'deepseek-chat',
    label: 'DeepSeek Chat',
    provider: 'deepseek',
    providerLabel: 'DeepSeek',
    description: 'High speed conversational model with solid analysis.',
    tags: ['Fast', 'Conversational'],
    apiModel: 'deepseek-chat',
    enabled: true,
  },
  {
    id: 'deepseek-coder',
    label: 'DeepSeek Coder',
    provider: 'deepseek',
    providerLabel: 'DeepSeek',
    description: 'Optimized for technical breakdowns and coding steps.',
    tags: ['Technical', 'Coding'],
    apiModel: 'deepseek-coder',
    enabled: true,
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
      enabled: model.enabled !== false,
      default: Boolean(model.default),
    })
    seen.add(id)
  }

  if (sanitized.length === 0) {
    return [...defaultAiModels]
  }

  if (!sanitized.some(model => model.default)) {
    const enabledModels = sanitized.filter(model => model.enabled !== false)
    const fallback = enabledModels.find(model => model.id === DEFAULT_MODEL_ID)
      ?? sanitized.find(model => model.id === DEFAULT_MODEL_ID)
      ?? enabledModels[0]
      ?? sanitized[0]
    if (fallback) {
      fallback.default = true
    }
  }

  return sanitized
}

export function findModelOption(models: AiModelOption[], id?: string | null) {
  return models.find(model => model.id === id) ?? null
}

export function resolveModelId(models: AiModelOption[], id?: string | null) {
  const enabledModels = models.filter(model => model.enabled !== false)
  const match = enabledModels.find(model => model.id === id)

  const defaultModel = enabledModels.find(model => model.default)
    ?? enabledModels[0]
    ?? models.find(model => model.default)
    ?? models[0]
  if (match) {
    return match.id
  }

  return defaultModel?.id ?? DEFAULT_MODEL_ID
}
