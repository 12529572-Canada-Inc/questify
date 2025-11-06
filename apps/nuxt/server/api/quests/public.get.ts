import type { Prisma } from '@prisma/client'
import { PrismaClient, QuestStatus } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50

type PublicQuestSort = 'newest' | 'oldest' | 'alphabetical' | 'recently-updated' | 'popular'
const FILTERABLE_STATUSES: QuestStatus[] = [
  QuestStatus.draft,
  QuestStatus.active,
  QuestStatus.completed,
  QuestStatus.failed,
]

function parseStatusFilter(value: unknown): QuestStatus[] {
  if (!value) {
    return []
  }

  const rawValues = Array.isArray(value) ? value : `${value}`.split(',')

  const unique = new Set<QuestStatus>()

  for (const entry of rawValues) {
    const normalized = `${entry}`.trim().toLowerCase()

    const match = FILTERABLE_STATUSES.find(status => status.toLowerCase() === normalized)

    if (match) {
      unique.add(match)
    }
  }

  return Array.from(unique)
}

function parseNumberParam(value: unknown, fallback: number, options: { min?: number, max?: number } = {}): number {
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : typeof value === 'number' ? value : NaN
  const { min, max } = options

  if (!Number.isFinite(num)) {
    return fallback
  }

  let result = num

  if (typeof min === 'number') {
    result = Math.max(min, result)
  }

  if (typeof max === 'number') {
    result = Math.min(max, result)
  }

  return result
}

function parseSortParam(value: unknown): PublicQuestSort {
  if (typeof value !== 'string') {
    return 'newest'
  }

  switch (value) {
    case 'oldest':
    case 'alphabetical':
    case 'recently-updated':
    case 'popular':
      return value
    default:
      return 'newest'
  }
}

function buildOrderBy(sort: PublicQuestSort): Prisma.QuestOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }]
    case 'alphabetical':
      return [{ title: 'asc' }, { createdAt: 'desc' }]
    case 'recently-updated':
      return [{ updatedAt: 'desc' }]
    case 'popular':
      return [{ tasks: { _count: 'desc' } }, { createdAt: 'desc' }]
    case 'newest':
    default:
      return [{ createdAt: 'desc' }]
  }
}

function buildSearchFilter(term: string): Prisma.QuestWhereInput {
  if (!term) {
    return {}
  }

  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      { goal: { contains: term, mode: 'insensitive' } },
      {
        owner: {
          name: {
            contains: term,
            mode: 'insensitive',
          },
        },
      },
    ],
  }
}

const handler = defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseNumberParam(query.page, 1, { min: 1 })
  const pageSize = parseNumberParam(query.pageSize, DEFAULT_PAGE_SIZE, { min: 1, max: MAX_PAGE_SIZE })
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const sort = parseSortParam(query.sort)
  const statusFilters = parseStatusFilter(query.status)

  const where: Prisma.QuestWhereInput = {
    isPublic: true,
    deletedAt: null,
    status: statusFilters.length
      ? { in: statusFilters }
      : { not: QuestStatus.archived },
    ...buildSearchFilter(search),
  }

  const [total, quests] = await Promise.all([
    prisma.quest.count({ where }),
    prisma.quest.findMany({
      where,
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
  ])

  const data = quests.map((quest) => {
    const taskCounts = {
      total: quest.tasks.length,
      todo: quest.tasks.filter(task => task.status === 'todo').length,
      inProgress: quest.tasks.filter(task => task.status === 'in-progress').length,
      completed: quest.tasks.filter(task => task.status === 'completed').length,
    }

    const { tasks, ...questData } = quest

    return {
      ...questData,
      taskCounts,
    }
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      sort,
      search: search || null,
      status: statusFilters.length ? statusFilters : null,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
})

export default handler

export type PublicQuestsResponse = Awaited<ReturnType<typeof handler>>
