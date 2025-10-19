import { describe, expect, it } from 'vitest'
import { buildQuestVisibilityFilter, canViewQuest } from '../../../server/utils/quest-visibility'

describe('quest visibility utilities', () => {
  it('builds a filter for anonymous and authenticated users', () => {
    expect(buildQuestVisibilityFilter(null)).toEqual({ isPublic: true })
    expect(buildQuestVisibilityFilter('user-1')).toEqual({
      OR: [
        { ownerId: 'user-1' },
        { isPublic: true },
      ],
    })
  })

  it('determines whether a quest can be viewed', () => {
    expect(canViewQuest({ isPublic: true, ownerId: 'user-1' })).toBe(true)
    expect(canViewQuest({ isPublic: false, ownerId: 'user-1' }, 'user-1')).toBe(true)
    expect(canViewQuest({ isPublic: false, ownerId: 'user-1' }, 'user-2')).toBe(false)
    expect(canViewQuest({ isPublic: false, ownerId: 'user-1' })).toBe(false)
  })
})
