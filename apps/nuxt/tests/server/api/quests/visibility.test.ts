import { describe, expect, it } from 'vitest'
import { buildQuestVisibilityFilter, canViewQuest } from '~/server/utils/quest-visibility'

describe('Quest visibility helpers', () => {
  describe('buildQuestVisibilityFilter', () => {
    it('only returns public quests for anonymous visitors', () => {
      expect(buildQuestVisibilityFilter()).toEqual({ isPublic: true })
      expect(buildQuestVisibilityFilter(null)).toEqual({ isPublic: true })
    })

    it('returns a filter that includes ownership for authenticated users', () => {
      expect(buildQuestVisibilityFilter('user-123')).toEqual({
        OR: [
          { ownerId: 'user-123' },
          { isPublic: true },
        ],
      })
    })
  })

  describe('canViewQuest', () => {
    it('allows viewing public quests', () => {
      expect(canViewQuest({ ownerId: 'user-123', isPublic: true }, undefined)).toBe(true)
      expect(canViewQuest({ ownerId: 'user-123', isPublic: true }, 'user-999')).toBe(true)
    })

    it('allows the owner to view private quests', () => {
      expect(canViewQuest({ ownerId: 'user-123', isPublic: false }, 'user-123')).toBe(true)
    })

    it('prevents other users from viewing private quests', () => {
      expect(canViewQuest({ ownerId: 'user-123', isPublic: false }, 'user-999')).toBe(false)
      expect(canViewQuest({ ownerId: 'user-123', isPublic: false }, null)).toBe(false)
    })
  })
})
