import type { Quest, QuestStatus } from '@prisma/client'

export type PublicQuestSort = 'newest' | 'oldest' | 'alphabetical' | 'recently-updated' | 'popular'

export type PublicQuestTaskCounts = {
  total: number
  todo: number
  inProgress: number
  completed: number
}

export type PublicQuestOwner = {
  id: string
  name: string | null
  email: string | null
}

export type PublicQuestSummary = Pick<
  Quest,
  'id' | 'ownerId' | 'title' | 'goal' | 'context' | 'constraints' | 'status' | 'createdAt' | 'updatedAt'
> & {
  owner: PublicQuestOwner
  taskCounts: PublicQuestTaskCounts
}

export type PublicQuestMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  sort: PublicQuestSort
  search: string | null
  status: QuestStatus[] | null
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type PublicQuestsResponse = {
  data: PublicQuestSummary[]
  meta: PublicQuestMeta
}

export const PUBLIC_QUEST_SORT_OPTIONS: Array<{ value: PublicQuestSort, label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'recently-updated', label: 'Recently Updated' },
  { value: 'popular', label: 'Most Tasks' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'oldest', label: 'Oldest' },
]

export const PUBLIC_QUEST_STATUS_FILTERS: Array<{ value: QuestStatus, label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'draft', label: 'Draft' },
]

export function normalizePublicQuestSort(value: unknown): PublicQuestSort {
  const entry = typeof value === 'string' ? value : ''
  const allowed = new Set(PUBLIC_QUEST_SORT_OPTIONS.map(option => option.value))

  if (allowed.has(entry as PublicQuestSort)) {
    return entry as PublicQuestSort
  }

  return 'newest'
}

export function normalizePublicQuestStatuses(value: unknown): QuestStatus[] {
  if (!value) {
    return []
  }

  const allowed = new Set(PUBLIC_QUEST_STATUS_FILTERS.map(option => option.value))
  const raw = Array.isArray(value) ? value : `${value}`.split(',')

  const statuses = raw
    .map(item => `${item}`.trim())
    .filter((item): item is QuestStatus => allowed.has(item as QuestStatus))

  return Array.from(new Set(statuses))
}
