declare interface QuestBody {
  title?: string
  goal?: string | null
  context?: string | null
  constraints?: string | null
  modelType?: string | null
  status?: 'draft' | 'active' | 'completed' | 'failed' | 'archived'
  isPublic?: boolean
}

declare interface CreateQuestResponse {
  success: boolean
  quest: {
    id: string
    title: string
    status: string
  }
}

declare interface QuestQueue {
  add: (type: 'decompose', data: {
    questId: string
    title: string
    goal?: string | null
    context?: string | null
    constraints?: string | null
    modelType: string
  }) => Promise<void>
}
