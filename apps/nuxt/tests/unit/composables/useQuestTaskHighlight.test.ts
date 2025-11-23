import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import type { QuestTaskTab } from '~/types/quest-tasks'
import { useQuestTaskHighlight } from '~/composables/useQuestTaskHighlight'

describe('useQuestTaskHighlight', () => {
  const rafMock = vi.fn((cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.stubGlobal('requestAnimationFrame', rafMock)
    rafMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('activates the correct tab and scrolls to the highlighted task', async () => {
    const highlighted = ref('task-1')
    const taskTab = ref<QuestTaskTab>('completed')
    const tasksLoading = computed(() => false)
    const todoTaskIds = computed(() => ['task-1'])
    const completedTaskIds = computed(() => [])

    const highlightedElement = document.createElement('div')
    highlightedElement.dataset.taskId = 'task-1'
    highlightedElement.scrollIntoView = vi.fn()
    document.body.appendChild(highlightedElement)

    useQuestTaskHighlight({
      taskTab,
      highlightedTaskId: computed(() => highlighted.value),
      tasksLoading,
      todoTaskIds,
      completedTaskIds,
    })

    await nextTick()
    await nextTick()

    expect(taskTab.value).toBe('todo')
    expect(rafMock).toHaveBeenCalled()
    expect(highlightedElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    })
  })

  it('does not scroll while tasks are loading', async () => {
    const highlighted = ref('task-2')
    const taskTab = ref<QuestTaskTab>('todo')
    const loadingFlag = ref(true)

    useQuestTaskHighlight({
      taskTab,
      highlightedTaskId: computed(() => highlighted.value),
      tasksLoading: computed(() => loadingFlag.value),
      todoTaskIds: computed(() => []),
      completedTaskIds: computed(() => ['task-2']),
    })

    await nextTick()
    expect(taskTab.value).toBe('todo')
    expect(rafMock).not.toHaveBeenCalled()

    loadingFlag.value = false
    await nextTick()
    await nextTick()

    expect(taskTab.value).toBe('completed')
    expect(rafMock).toHaveBeenCalled()
  })
})
