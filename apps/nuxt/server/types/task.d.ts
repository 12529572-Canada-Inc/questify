declare interface TaskBody {
  title?: string
  details?: string | null
  extraContent?: string | null
  status?: 'todo' | 'pending' | 'in-progress' | 'completed' | 'draft'
}

declare interface TaskInvestigationBody {
  prompt?: string | null
  modelType?: string | null
}
