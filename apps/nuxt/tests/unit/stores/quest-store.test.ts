import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQuestStore } from '~/stores/quest'
import { createQuest } from '../support/sample-data'

const fetchMock = vi.fn()
const sampleQuest = createQuest()

beforeEach(() => {
  setActivePinia(createPinia())
  fetchMock.mockReset()
  vi.stubGlobal('$fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useQuestStore', () => {
  it('fetches quests and caches results', async () => {
    fetchMock.mockResolvedValueOnce([sampleQuest])

    const store = useQuestStore()
    const first = await store.fetchQuests()

    expect(fetchMock).toHaveBeenCalledWith('/api/quests')
    expect(first).toHaveLength(1)
    expect(store.hasQuests).toBe(true)

    await store.fetchQuests()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('forces refetch when requested', async () => {
    fetchMock.mockResolvedValue([sampleQuest])
    const store = useQuestStore()

    await store.fetchQuests()
    await store.fetchQuests({ force: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('supports upserting and removing quests', () => {
    const store = useQuestStore()
    store.setQuests([sampleQuest])

    const updated = { ...sampleQuest, title: 'Updated Quest' }
    store.upsertQuest(updated as never)

    expect(store.quests[0]?.title).toBe('Updated Quest')

    store.removeQuest(updated.id as string)
    expect(store.quests).toHaveLength(0)
  })

  it('resets store state including loaded flag', () => {
    const store = useQuestStore()
    store.setQuests([sampleQuest])

    expect(store.quests).toHaveLength(1)
    expect(store.loaded).toBe(true)

    store.reset()

    expect(store.quests).toHaveLength(0)
    expect(store.loaded).toBe(false)
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })
})
