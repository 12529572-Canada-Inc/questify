import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useQuestLifecycle } from '~/composables/useQuestLifecycle'

const showSnackbar = vi.fn()

vi.mock('~/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar,
  }),
}))

vi.mock('~/utils/error', () => ({
  resolveApiError: (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback),
}))

describe('useQuestLifecycle', () => {
  const fetchMock = vi.fn()
  const onArchived = vi.fn()
  const onDeleted = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    onArchived.mockReset()
    onDeleted.mockReset()
    showSnackbar.mockReset()
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('short-circuits when the viewer is not the owner or quest id missing', async () => {
    const lifecycle = useQuestLifecycle({
      questId: ref(null),
      isOwner: ref(false),
    })

    await lifecycle.archiveQuest()
    await lifecycle.deleteQuest()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('archives and deletes quests via HTTP calls and callbacks', async () => {
    fetchMock.mockResolvedValue({})
    const lifecycle = useQuestLifecycle({
      questId: ref('quest-1'),
      isOwner: ref(true),
      onArchived,
      onDeleted,
    })

    await lifecycle.archiveQuest()
    await lifecycle.deleteQuest()

    expect(fetchMock).toHaveBeenCalledWith('/api/quests/quest-1/archive', { method: 'PATCH' })
    expect(fetchMock).toHaveBeenCalledWith('/api/quests/quest-1', { method: 'DELETE' })
    expect(onArchived).toHaveBeenCalled()
    expect(onDeleted).toHaveBeenCalled()
    expect(showSnackbar).toHaveBeenCalledWith('Quest archived successfully.', expect.any(Object))
    expect(showSnackbar).toHaveBeenCalledWith('Quest permanently deleted.', expect.any(Object))
  })

  it('surfaces API failures and returns false', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'))
    const lifecycle = useQuestLifecycle({
      questId: ref('quest-1'),
      isOwner: ref(true),
    })

    const archived = await lifecycle.archiveQuest()
    expect(archived).toBe(false)
    expect(showSnackbar).toHaveBeenCalledWith('boom', expect.any(Object))
  })
})
