<script setup lang="ts">
import type { Quest } from '@prisma/client'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuestLifecycle } from '~/composables/useQuestLifecycle'
import { useSnackbar } from '~/composables/useSnackbar'
import { useQuestStore } from '~/stores/quest'
import { useUserStore } from '~/stores/user'

const questStore = useQuestStore()
const userStore = useUserStore()
const { showSnackbar } = useSnackbar()

const { quests, hasQuests } = storeToRefs(questStore)
const { user } = storeToRefs(userStore)

if (!user.value) {
  await userStore.fetchSession().catch(() => null)
}

const showArchived = ref(false)

let initialFetchFailed = false

try {
  await questStore.fetchQuests({ includeArchived: showArchived.value })
}
catch (error) {
  initialFetchFailed = true
  console.error('Failed to load quests:', error)
}

if (!initialFetchFailed && !hasQuests.value) {
  showSnackbar('You need to create your first quest!', {
    variant: 'info',
  })
  await navigateTo('/quests/new', { replace: true })
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
    <v-row class="quests-header mb-4">
      <v-col
        cols="12"
        sm="6"
        class="quests-header__title"
      >
        <h2 class="text-h5 font-weight-bold text-white mb-0">
          Quests
        </h2>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        class="quests-header__actions"
      >
        <v-btn
          color="primary"
          class="quests-header__create"
          :to="`/quests/new`"
        >
          Create Quest
        </v-btn>
      </v-col>
    </v-row>

    <v-row
      v-if="currentUserId"
      class="mb-2"
    >
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="showArchived"
          inset
          color="primary"
          label="Show Archived Quests"
        />
      </v-col>
    </v-row>

    <QuestList
      :quests="questsList"
      :current-user-id="currentUserId"
      @delete-quest="openLifecycleDialog"
    />

    <v-btn
      v-if="$vuetify.display.smAndDown"
      color="primary"
      class="fab"
      aria-label="Create quest"
      icon="mdi-plus"
      :to="`/quests/new`"
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

<style scoped>
.fab {
  position: fixed;
  bottom: 16px;
  right: 16px;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  z-index: 1000;
}

.quests-header {
  align-items: center;
  row-gap: 12px;
}

.quests-header__actions {
  display: flex;
  justify-content: flex-end;
}

.quests-header__create {
  min-width: 0;
}

@media (max-width: 600px) {
  .quests-header__actions {
    justify-content: flex-start;
  }

  .quests-header__create {
    width: 100%;
  }
}
</style>
