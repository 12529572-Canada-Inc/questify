import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useQuestActions } from '~/composables/useQuestActions'

describe('useQuestActions', () => {
  const refresh = vi.fn<[], Promise<void>>().mockResolvedValue()
  const fetchMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    fetchMock.mockClear()
    refresh.mockClear()
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('skips remote updates when the user is not the owner', async () => {
    const actions = useQuestActions({
      questId: 'quest-42',
      refresh,
      isOwner: ref(false),
    })

    await actions.markTaskCompleted('task-1')
    await actions.completeQuest()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('sends mutations and refreshes quest data when permitted', async () => {
    const actions = useQuestActions({
      questId: 'quest-7',
      refresh,
      isOwner: ref(true),
    })

    await actions.markTaskIncomplete('task-9')
    await actions.reopenQuest()

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/task-9', expect.objectContaining({
      method: 'PATCH',
      body: { status: 'todo' },
    }))
    expect(fetchMock).toHaveBeenCalledWith('/api/quests/quest-7', expect.objectContaining({
      method: 'PATCH',
      body: { status: 'active' },
    }))
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})
