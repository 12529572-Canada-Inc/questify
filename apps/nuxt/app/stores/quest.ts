import { computed, ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Quest } from '@prisma/client'

type FetchOptions = {
  force?: boolean
}

export const useQuestStore = defineStore('quests', () => {
  const quests = ref<Quest[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<unknown>(null)

  const hasQuests = computed(() => quests.value.length > 0)

  async function fetchQuests(options: FetchOptions = {}) {
    if (loaded.value && !options.force) {
      return quests.value
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<Quest[]>('/api/quests')
      quests.value = Array.isArray(data) ? data : []
      loaded.value = true
      return quests.value
    }
    catch (err) {
      error.value = err
      throw err
    }
    finally {
      loading.value = false
    }
  }

  function setQuests(list: Quest[]) {
    quests.value = Array.isArray(list) ? list : []
    loaded.value = true
  }

  function upsertQuest(quest: Quest) {
    const index = quests.value.findIndex(existing => existing.id === quest.id)

    if (index >= 0) {
      quests.value.splice(index, 1, quest)
    }
    else {
      quests.value.push(quest)
    }
  }

  function removeQuest(id: Quest['id']) {
    quests.value = quests.value.filter(quest => quest.id !== id)
  }

  function getQuestById(id: Quest['id']) {
    return quests.value.find(quest => quest.id === id) ?? null
  }

  return {
    quests,
    loading,
    loaded,
    hasQuests,
    error,
    fetchQuests,
    setQuests,
    upsertQuest,
    removeQuest,
    getQuestById,
  }
})

if (import.meta.hot?.accept) {
  import.meta.hot.accept(acceptHMRUpdate(useQuestStore, import.meta.hot))
}
