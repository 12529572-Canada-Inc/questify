import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useQuestTaskTabs, useQuestTasks } from '../../../app/composables/useQuestTasks'
import { createTask } from '../support/sample-data'

describe('useQuestTasks', () => {
  it('normalizes, sorts, and splits quest tasks', () => {
    const quest = ref({
      status: 'draft',
      tasks: [
        createTask({ id: 'task-b', order: 2, status: 'todo', investigations: null }),
        createTask({ id: 'task-a', order: 1, status: 'completed', investigations: [{ id: 'inv-1' }] }),
        createTask({ id: 'task-c', order: 3, status: 'todo', investigations: undefined }),
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
    const quest = ref({ status: 'draft', tasks: [] as ReturnType<typeof createTask>[] })
    const { tasksLoading, hasTasks } = useQuestTasks(quest)

    expect(tasksLoading.value).toBe(true)
    expect(hasTasks.value).toBe(false)
  })
})

describe('useQuestTaskTabs', () => {
  it('switches tabs when task counts change', async () => {
    const todo = ref([createTask({ id: 'task-1', status: 'todo' })])
    const completed = ref<ReturnType<typeof createTask>[]>([])

    const { taskTab } = useQuestTaskTabs(todo, completed)
    expect(taskTab.value).toBe('todo')

    todo.value = []
    completed.value = [createTask({ id: 'task-2', status: 'completed' })]
    await nextTick()
    expect(taskTab.value).toBe('completed')

    completed.value = []
    todo.value = [createTask({ id: 'task-3', status: 'todo' })]
    await nextTick()
    expect(taskTab.value).toBe('todo')
  })
})
