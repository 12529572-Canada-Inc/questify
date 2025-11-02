<script setup lang="ts">
import type { Quest } from '@prisma/client'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuestLifecycle } from '~/composables/useQuestLifecycle'
import { useQuestStore } from '~/stores/quest'
import { useUserStore } from '~/stores/user'

const questStore = useQuestStore()
const userStore = useUserStore()

definePageMeta({
  middleware: ['quests-owner'],
})

const { quests } = storeToRefs(questStore)
const { user } = storeToRefs(userStore)

if (!user.value) {
  await userStore.fetchSession().catch(() => null)
}

const showArchived = ref(false)

try {
  await questStore.fetchQuests({ includeArchived: showArchived.value })
}
catch (error) {
  console.error('Failed to load quests:', error)
}

watch(showArchived, async (value) => {
  try {
    await questStore.fetchQuests({ includeArchived: value, force: true })
  }
  catch (error) {
    console.error('Failed to toggle archived quests:', error)
  }
})

const questsList = computed(() => quests.value ?? [])
const currentUserId = computed(() => user.value?.id ?? null)

const lifecycleDialogOpen = ref(false)
const lifecycleTarget = ref<Quest | null>(null)

const { archiveQuest, deleteQuest, archiveLoading, deleteLoading } = useQuestLifecycle({
  questId: computed(() => lifecycleTarget.value?.id ?? null),
  isOwner: computed(() => lifecycleTarget.value?.ownerId === currentUserId.value),
  onArchived: async () => {
    await questStore.fetchQuests({ includeArchived: showArchived.value, force: true })
  },
  onDeleted: async () => {
    const questId = lifecycleTarget.value?.id
    if (questId) {
      questStore.removeQuest(questId)
    }
    await questStore.fetchQuests({ includeArchived: showArchived.value, force: true })
  },
})

function openLifecycleDialog(quest: Quest) {
  lifecycleTarget.value = quest
  lifecycleDialogOpen.value = true
}

function closeLifecycleDialog() {
  lifecycleDialogOpen.value = false
  lifecycleTarget.value = null
}

async function handleArchiveQuest() {
  const success = await archiveQuest()
  if (success) {
    closeLifecycleDialog()
  }
}

async function handleDeleteQuest() {
  const success = await deleteQuest()
  if (success) {
    closeLifecycleDialog()
  }
}

const dialogQuestTitle = computed(() => lifecycleTarget.value?.title ?? 'this quest')
</script>

<template>
  <v-container class="py-6">
    <QuestSubheader
      v-model:show-archived="showArchived"
      :can-toggle-archived="!!currentUserId"
    />

    <QuestList
      :quests="questsList"
      :current-user-id="currentUserId"
      @delete-quest="openLifecycleDialog"
    />
    <QuestDeleteDialog
      v-model="lifecycleDialogOpen"
      :quest-title="dialogQuestTitle"
      :archive-loading="archiveLoading"
      :delete-loading="deleteLoading"
      @archive="handleArchiveQuest"
      @delete="handleDeleteQuest"
      @cancel="closeLifecycleDialog"
    />
  </v-container>
</template>
