import { describe, expect, it } from 'vitest'
import { QuestStatus } from '@prisma/client'
import { buildQuestVisibilityFilter, canViewQuest } from '../../../server/utils/quest-visibility'

describe('quest visibility utilities', () => {
  it('builds a filter for anonymous and authenticated users', () => {
    expect(buildQuestVisibilityFilter(null)).toEqual({
      deletedAt: null,
      status: { not: QuestStatus.archived },
      isPublic: true,
    })
    expect(buildQuestVisibilityFilter('user-1')).toEqual({
      deletedAt: null,
      status: { not: QuestStatus.archived },
      OR: [
        { ownerId: 'user-1' },
        { isPublic: true, status: { not: QuestStatus.archived } },
      ],
    })
  })

  it('determines whether a quest can be viewed', () => {
    const baseQuest = { deletedAt: null, status: QuestStatus.active }
    expect(canViewQuest({ ...baseQuest, isPublic: true, ownerId: 'user-1' })).toBe(true)
    expect(canViewQuest({ ...baseQuest, isPublic: false, ownerId: 'user-1' }, 'user-1')).toBe(true)
    expect(canViewQuest({ ...baseQuest, isPublic: false, ownerId: 'user-1' }, 'user-2')).toBe(false)
    expect(canViewQuest({ ...baseQuest, isPublic: false, ownerId: 'user-1' })).toBe(false)
    expect(canViewQuest({ ...baseQuest, isPublic: true, ownerId: 'user-1', status: QuestStatus.archived }, null)).toBe(false)
    expect(canViewQuest({ ...baseQuest, isPublic: false, ownerId: 'user-1', status: QuestStatus.archived }, 'user-1')).toBe(true)
  })
})
