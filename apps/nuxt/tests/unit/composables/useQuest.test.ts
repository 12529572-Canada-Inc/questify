import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQuestStore } from '~/stores/quest'
import { useQuest, useQuests } from '../../../app/composables/useQuest'

const useFetchMock = vi.fn()

beforeEach(() => {
  setActivePinia(createPinia())
  useFetchMock.mockReset()
  vi.stubGlobal('useFetch', useFetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useQuest composables', () => {
  it('fetches an individual quest with cache key', () => {
    useQuest('quest-123')

    expect(useFetchMock).toHaveBeenCalledWith('/api/quests/quest-123', {
      key: 'quest-quest-123',
    })
  })

  it('fetches quest collections via the store', async () => {
    const questStore = useQuestStore()
    const fetchSpy = vi.spyOn(questStore, 'fetchQuests').mockResolvedValue([])

    await useQuests()

    expect(fetchSpy).toHaveBeenCalled()
  })
})
