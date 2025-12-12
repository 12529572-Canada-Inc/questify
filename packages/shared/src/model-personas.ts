import type { AiProvider } from './ai-models'

export type PersonaSpeed = 'fast' | 'faster' | 'fastest'
export type PersonaCost = 'low' | 'medium' | 'high'
export type PersonaContext = 'short' | 'medium' | 'long'

export type ModelPersona = {
  key: string
  name: string
  tagline: string
  avatarUrl?: string | null
  bestFor: string[]
  speed: PersonaSpeed
  cost: PersonaCost
  contextLength: PersonaContext
  provider: AiProvider
  modelId: string
  notes?: string | null
  infoUrl?: string | null
  recommended?: boolean
  recommendedReason?: string | null
  active?: boolean
  enabled?: boolean
  disabledReason?: string | null
}

const personaProviders: AiProvider[] = ['openai', 'anthropic', 'deepseek']

export const defaultModelPersonas: ModelPersona[] = [
  {
    key: 'swift-scout',
    name: 'Swift Scout',
    tagline: 'Fast drafts without burning tokens.',
    bestFor: [
      'Brainstorming and ideation',
      'Short summaries and rewrites',
      'Low-cost experimentation',
    ],
    speed: 'fastest',
    cost: 'low',
    contextLength: 'short',
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    recommended: true,
    recommendedReason: 'Fast and low-cost for drafts and quick replies.',
  },
  {
    key: 'balanced-navigator',
    name: 'Balanced Navigator',
    tagline: 'Steady quality and speed for everyday quests.',
    bestFor: [
      'General planning or chat',
      'Multi-step to-do breakdowns',
      'Working with mixed text and images',
    ],
    speed: 'faster',
    cost: 'medium',
    contextLength: 'medium',
    provider: 'openai',
    modelId: 'gpt-4o',
  },
  {
    key: 'sharp-strategist',
    name: 'Sharp Strategist',
    tagline: 'Handles hard reasoning with structured outputs.',
    bestFor: [
      'Complex research questions',
      'Scenario planning and trade-offs',
      'Detailed outlines or long-form drafts',
    ],
    speed: 'fast',
    cost: 'high',
    contextLength: 'long',
    provider: 'openai',
    modelId: 'gpt-4.1',
  },
  {
    key: 'haiku-spark',
    name: 'Haiku Spark',
    tagline: 'Snappy Anthropic replies with clear tone.',
    bestFor: [
      'Concise answers and FAQs',
      'Support macros or quick copy',
      'Friendly short-form writing',
    ],
    speed: 'fastest',
    cost: 'low',
    contextLength: 'medium',
    provider: 'anthropic',
    modelId: 'claude-3.5-haiku',
  },
  {
    key: 'storyweaver',
    name: 'Storyweaver',
    tagline: 'Polished writing with long memory.',
    bestFor: [
      'Long-form articles and drafts',
      'Detailed summaries with citations',
      'Tone-sensitive editing',
    ],
    speed: 'faster',
    cost: 'medium',
    contextLength: 'long',
    provider: 'anthropic',
    modelId: 'claude-3.5-sonnet',
  },
  {
    key: 'opus-oracle',
    name: 'Opus Oracle',
    tagline: 'Premium depth when stakes are high.',
    bestFor: [
      'Executive briefs and strategy',
      'Reasoning-heavy investigations',
      'High-accuracy communications',
    ],
    speed: 'fast',
    cost: 'high',
    contextLength: 'long',
    provider: 'anthropic',
    modelId: 'claude-3-opus',
  },
  {
    key: 'code-smith',
    name: 'Code Smith',
    tagline: 'Code-aware assistant tuned for dev tasks.',
    bestFor: [
      'Generating or refactoring snippets',
      'Explaining code step-by-step',
      'Planning debugging approaches',
    ],
    speed: 'faster',
    cost: 'low',
    contextLength: 'medium',
    provider: 'deepseek',
    modelId: 'deepseek-coder',
  },
  {
    key: 'chat-guide',
    name: 'Chat Guide',
    tagline: 'Quick conversational helper for follow-ups.',
    bestFor: [
      'Light research or comparisons',
      'Follow-up questions and summaries',
      'Friendly explanations',
    ],
    speed: 'fastest',
    cost: 'low',
    contextLength: 'medium',
    provider: 'deepseek',
    modelId: 'deepseek-chat',
  },
]

export function sanitizeModelPersonas(personas: ModelPersona[] | null | undefined): ModelPersona[] {
  const seen = new Set<string>()
  const sanitized: ModelPersona[] = []

  for (const persona of personas ?? []) {
    if (!persona || typeof persona !== 'object') continue
    const key = typeof persona.key === 'string' ? persona.key.trim() : ''
    const provider = persona.provider
    const modelId = typeof persona.modelId === 'string' ? persona.modelId.trim() : ''

    if (!key || seen.has(key)) continue
    if (!personaProviders.includes(provider as AiProvider)) continue
    if (!modelId) continue

    sanitized.push({
      key,
      name: typeof persona.name === 'string' && persona.name.trim() ? persona.name.trim() : key,
      tagline: typeof persona.tagline === 'string' ? persona.tagline.trim() : '',
      avatarUrl: persona.avatarUrl ?? null,
      bestFor: Array.isArray(persona.bestFor)
        ? persona.bestFor
          .filter(item => typeof item === 'string' && item.trim().length > 0)
          .map(item => item.trim())
        : [],
      speed: (persona.speed ?? 'fast') as PersonaSpeed,
      cost: (persona.cost ?? 'medium') as PersonaCost,
      contextLength: (persona.contextLength ?? 'medium') as PersonaContext,
      provider: provider as AiProvider,
      modelId,
      notes: persona.notes ?? null,
      infoUrl: persona.infoUrl ?? null,
      recommended: Boolean(persona.recommended),
      recommendedReason: typeof persona.recommendedReason === 'string'
        ? persona.recommendedReason.trim()
        : null,
      active: persona.active !== false,
      enabled: persona.enabled !== false,
      disabledReason: persona.disabledReason ?? null,
    })
    seen.add(key)
  }

  return sanitized.length > 0 ? sanitized : [...defaultModelPersonas]
}

export function findPersona(personas: ModelPersona[], key?: string | null) {
  if (!key) return null
  const trimmed = key.trim()
  if (!trimmed) return null
  return personas.find(persona => persona.key === trimmed) ?? null
}
