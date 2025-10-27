export const QUEST_STATUS = {
  draft: 'draft',
  active: 'active',
  completed: 'completed',
  failed: 'failed',
  archived: 'archived',
} as const

export type QuestStatus = typeof QUEST_STATUS[keyof typeof QUEST_STATUS]
