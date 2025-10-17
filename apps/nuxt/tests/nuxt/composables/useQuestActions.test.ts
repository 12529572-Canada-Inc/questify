import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useQuestActions } from '~/composables/useQuestActions'

describe('useQuestActions', () => {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const fetchMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    refresh.mockClear()
    fetchMock.mockClear()
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('skips remote mutations when the viewer is not the owner', async () => {
    const actions = useQuestActions({
      questId: 'quest-not-owner',
      refresh,
      isOwner: ref(false),
    })

    await actions.markTaskCompleted('task-1')
    await actions.updateTask('task-2', { title: 'Updated' })
    await actions.investigateTask('task-3', 'Check the blockers')
    await actions.completeQuest()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('issues task and quest mutations and refreshes when permitted', async () => {
    const actions = useQuestActions({
      questId: 'quest-allowed',
      refresh,
      isOwner: ref(true),
    })

    await actions.markTaskIncomplete('task-42')
    await actions.updateTask('task-42', { extraContent: 'Helpful context' })
    await actions.completeQuest()
    await actions.reopenQuest()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/task-42',
      expect.objectContaining({
        method: 'PATCH',
        body: { status: 'todo' },
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/task-42',
      expect.objectContaining({
        method: 'PATCH',
        body: { extraContent: 'Helpful context' },
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/quests/quest-allowed',
      expect.objectContaining({
        method: 'PATCH',
        body: { status: 'completed' },
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/quests/quest-allowed',
      expect.objectContaining({
        method: 'PATCH',
        body: { status: 'active' },
      }),
    )
    expect(refresh).toHaveBeenCalledTimes(4)
  })

  it('trims investigation prompts and skips empty payloads', async () => {
    const actions = useQuestActions({
      questId: 'quest-prompts',
      refresh,
      isOwner: ref(true),
    })

    await actions.investigateTask('task-trim', '   Details please   ')
    await actions.investigateTask('task-empty', '   ')
    await actions.investigateTask('task-null', null)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/task-trim/investigations',
      expect.objectContaining({
        method: 'POST',
        body: { prompt: 'Details please' },
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/task-empty/investigations',
      expect.objectContaining({
        method: 'POST',
        body: undefined,
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/task-null/investigations',
      expect.objectContaining({
        method: 'POST',
        body: undefined,
      }),
    )
    expect(refresh).toHaveBeenCalledTimes(3)
  })
})
