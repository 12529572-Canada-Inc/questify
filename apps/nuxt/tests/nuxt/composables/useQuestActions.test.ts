import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useQuestActions } from '~/composables/useQuestActions'

const showSnackbar = vi.fn()
const snackbarCurrent = ref(null)
const snackbarVisible = ref(false)

vi.mock('~/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    current: snackbarCurrent,
    visible: snackbarVisible,
    showSnackbar,
    setVisible: vi.fn(),
    dismissCurrent: vi.fn(),
    clearQueue: vi.fn(),
  }),
}))

describe('useQuestActions', () => {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const fetchMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    refresh.mockClear()
    fetchMock.mockClear()
    fetchMock.mockResolvedValue(undefined)
    vi.stubGlobal('$fetch', fetchMock)
    showSnackbar.mockClear()
    snackbarCurrent.value = null
    snackbarVisible.value = false
    globalThis.__resetNuxtState?.()
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
    await actions.investigateTask('task-3', { prompt: 'Check the blockers', modelType: 'gpt-4o-mini' })
    await actions.completeQuest()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    expect(showSnackbar).not.toHaveBeenCalled()
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
    expect(showSnackbar).toHaveBeenCalledWith('Task moved back to to-do.', expect.objectContaining({ variant: 'success' }))
    expect(showSnackbar).toHaveBeenCalledWith('Task updated successfully.', expect.objectContaining({ variant: 'success' }))
    expect(showSnackbar).toHaveBeenCalledWith('Quest marked as completed.', expect.objectContaining({ variant: 'success' }))
    expect(showSnackbar).toHaveBeenCalledWith('Quest reopened and set to active.', expect.objectContaining({ variant: 'success' }))
  })

  it('trims investigation prompts before sending', async () => {
    const actions = useQuestActions({
      questId: 'quest-prompts',
      refresh,
      isOwner: ref(true),
    })

    await actions.investigateTask('task-trim', {
      prompt: '   Details please   ',
      modelType: 'gpt-4o',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/task-trim/investigations',
      expect.objectContaining({
        method: 'POST',
        body: { prompt: 'Details please', modelType: 'gpt-4o', images: [] },
      }),
    )
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(showSnackbar).toHaveBeenCalledWith('Investigation request submitted.', expect.objectContaining({ variant: 'success' }))
  })

  it('surfaces API failures with an error snackbar', async () => {
    const actions = useQuestActions({
      questId: 'quest-error',
      refresh,
      isOwner: ref(true),
    })

    fetchMock.mockRejectedValueOnce(new Error('Network down'))

    await expect(actions.completeQuest()).rejects.toThrow('Network down')

    expect(refresh).not.toHaveBeenCalled()
    expect(showSnackbar).toHaveBeenCalledWith('Network down', expect.objectContaining({ variant: 'error' }))
  })
})
