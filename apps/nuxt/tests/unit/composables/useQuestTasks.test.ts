import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useQuestTaskTabs, useQuestTasks } from '../../../app/composables/useQuestTasks'

describe('useQuestTasks', () => {
  it('normalizes, sorts, and splits quest tasks', () => {
    const quest = ref({
      status: 'draft',
      tasks: [
        {
          id: 'task-b',
          order: 2,
          status: 'todo',
          investigations: null,
        },
        {
          id: 'task-a',
          order: 1,
          status: 'completed',
          investigations: [{ id: 'inv-1' }],
        },
        {
          id: 'task-c',
          status: 'todo',
          investigations: undefined,
        },
      ],
    })

    const { allTasks, tasksLoading, todoTasks, completedTasks, hasTasks } = useQuestTasks(quest)

    expect(tasksLoading.value).toBe(false)
    expect(hasTasks.value).toBe(true)
    expect(allTasks.value.map(task => task.id)).toEqual(['task-a', 'task-b', 'task-c'])
    expect(allTasks.value[0]!.investigations).toEqual([{ id: 'inv-1' }])
    expect(allTasks.value[1]!.investigations).toEqual([])
    expect(todoTasks.value.map(task => task.id)).toEqual(['task-b', 'task-c'])
    expect(completedTasks.value.map(task => task.id)).toEqual(['task-a'])
  })

  it('marks loading state when draft quests have no tasks', () => {
    const quest = ref({ status: 'draft', tasks: [] })
    const { tasksLoading, hasTasks } = useQuestTasks(quest)

    expect(tasksLoading.value).toBe(true)
    expect(hasTasks.value).toBe(false)
  })
})

describe('useQuestTaskTabs', () => {
  it('switches tabs when task counts change', async () => {
    const todo = ref([{ id: 'task-1' }])
    const completed = ref<{ id: string }[]>([])

    const { taskTab } = useQuestTaskTabs(todo, completed)
    expect(taskTab.value).toBe('todo')

    todo.value = []
    completed.value = [{ id: 'task-2' }]
    await nextTick()
    expect(taskTab.value).toBe('completed')

    completed.value = []
    todo.value = [{ id: 'task-3' }]
    await nextTick()
    expect(taskTab.value).toBe('todo')
  })
})
