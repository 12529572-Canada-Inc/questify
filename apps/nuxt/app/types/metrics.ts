export interface UserMetrics {
  totalQuests: number
  activeQuests: number
  completedQuests: number
  publicQuests: number
  privateQuests: number
  totalTasks: number
  completedTasks: number
  completionRate: number
  lastActiveAt: string | null
}
