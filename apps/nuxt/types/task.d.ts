type TaskBody = {
  title?: string
  description?: string | null
  status?: 'todo' | 'pending' | 'in-progress' | 'completed' | 'draft'
}
