declare interface QuestBody {
  title?: string
  goal?: string | null
  context?: string | null
  constraints?: string | null
  status?: 'draft' | 'active' | 'completed' | 'failed'
}
