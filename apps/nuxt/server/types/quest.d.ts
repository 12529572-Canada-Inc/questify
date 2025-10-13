declare interface QuestBody {
  title?: string
  goal?: string | null
  context?: string | null
  constraints?: string | null
  status?: 'draft' | 'active' | 'completed' | 'failed'
}

declare interface CreateQuestResponse {
  id: string
  title: string
  status: string
}

declare interface QuestQueue {
  add: (type: 'decompose', data: {
    questId: string
    title: string
    goal?: string | null
    context?: string | null
    constraints?: string | null
  }) => Promise<void>
}
