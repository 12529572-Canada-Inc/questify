import { computed, ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import type { TaskListItem } from '~/types/task'

type FetchOptions = {
  force?: boolean
}

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<TaskListItem[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<unknown>(null)

  const hasTasks = computed(() => tasks.value.length > 0)

  async function fetchTasks(options: FetchOptions = {}) {
    if (loaded.value && !options.force) {
      return tasks.value
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<TaskListItem[]>('/api/tasks')
      tasks.value = Array.isArray(data) ? data : []
      loaded.value = true
      return tasks.value
    }
    catch (err) {
      error.value = err
      throw err
    }
    finally {
      loading.value = false
    }
  }

  function setTasks(list: TaskListItem[]) {
    tasks.value = Array.isArray(list) ? list : []
    loaded.value = true
  }

  function reset() {
    tasks.value = []
    loaded.value = false
    loading.value = false
    error.value = null
  }

  return {
    tasks,
    loading,
    loaded,
    error,
    hasTasks,
    fetchTasks,
    setTasks,
    reset,
  }
})

if (import.meta.hot?.accept) {
  import.meta.hot.accept(acceptHMRUpdate(useTaskStore, import.meta.hot))
}
