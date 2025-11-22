<script setup lang="ts">
import type { Quest } from '@prisma/client'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { watchDebounced } from '@vueuse/core'
import { useQuestLifecycle } from '~/composables/useQuestLifecycle'
import { useQuestStore } from '~/stores/quest'
import { useUserStore } from '~/stores/user'
import { QUEST_STATUS, type QuestStatus } from '~/types/quest'

const questStore = useQuestStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

definePageMeta({
  middleware: ['quests-owner'],
})

const { quests } = storeToRefs(questStore)
const { user } = storeToRefs(userStore)

function parseBooleanParam(value: unknown) {
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
  }
  return value === true
}

const allowedStatuses = Object.values(QUEST_STATUS)

function parseStatusQuery(value: unknown): QuestStatus[] {
  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(',')
    .map(item => item.trim())
    .filter((item): item is QuestStatus => allowedStatuses.includes(item as QuestStatus))
}

function arraysEqual<T>(first: T[], second: T[]): boolean {
  if (first.length !== second.length) {
    return false
  }
  return first.every((item, index) => item === second[index])
}

function formatStatusLabel(status: QuestStatus) {
  return status.replace(/^\w/, match => match.toUpperCase())
}

function normalizeRouteQuery(query: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {}
  if (parseBooleanParam(query.archived)) {
    normalized.archived = 'true'
  }
  const statuses = parseStatusQuery(query.status)
  if (statuses.length > 0) {
    normalized.status = statuses.join(',')
  }
  if (typeof query.search === 'string' && query.search.trim()) {
    normalized.search = query.search.trim()
  }
  return normalized
}

function isShallowEqualRecord(a: Record<string, string>, b: Record<string, string>) {
  const aEntries = Object.entries(a)
  const bEntries = Object.entries(b)
  if (aEntries.length !== bEntries.length) {
    return false
  }
  return aEntries.every(([key, value]) => b[key] === value)
}

if (!user.value) {
  await userStore.fetchSession().catch(() => null)
}

const showArchived = ref(parseBooleanParam(route.query.archived))
const selectedStatuses = ref<QuestStatus[]>(parseStatusQuery(route.query.status))
const searchTerm = ref(typeof route.query.search === 'string' ? route.query.search : '')
const debouncedSearch = ref(searchTerm.value.trim())

watchDebounced(searchTerm, (value) => {
  debouncedSearch.value = value.trim()
}, { debounce: 300, maxWait: 600 })

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
const questStatusOptions = allowedStatuses.map(status => ({
  title: formatStatusLabel(status),
  value: status,
}))

const filteredQuests = computed(() => {
  const search = debouncedSearch.value.toLowerCase()
  const selected = selectedStatuses.value
  return questsList.value.filter((quest) => {
    const matchesStatus = selected.length === 0 || selected.includes(quest.status as QuestStatus)
    const matchesSearch = search
      ? [
          quest.title,
          quest.goal ?? '',
          quest.context ?? '',
          quest.constraints ?? '',
        ].some(field => field?.toLowerCase().includes(search))
      : true

    return matchesStatus && matchesSearch
  })
})

const questTableHeaders = [
  { title: 'Quest', key: 'title', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Visibility', key: 'isPublic', sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
] as const

const statusColorMap: Record<QuestStatus, string> = {
  draft: 'amber-darken-2',
  active: 'primary',
  completed: 'success',
  failed: 'error',
  archived: 'grey-darken-1',
}

function statusColor(status: QuestStatus) {
  return statusColorMap[status] ?? 'secondary'
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const tableSort = ref([{ key: 'updatedAt', order: 'desc' as const }])

const queryState = computed(() => {
  const query: Record<string, string> = {}
  if (showArchived.value) {
    query.archived = 'true'
  }
  if (selectedStatuses.value.length > 0) {
    query.status = selectedStatuses.value.join(',')
  }
  if (debouncedSearch.value) {
    query.search = debouncedSearch.value
  }
  return query
})

if (import.meta.client) {
  watch(queryState, (nextQuery) => {
    const currentQuery = normalizeRouteQuery(route.query as Record<string, unknown>)
    if (!isShallowEqualRecord(currentQuery, nextQuery)) {
      router.replace({ path: route.path, query: nextQuery }).catch((err) => {
        if (import.meta.dev) {
          console.error('Failed to sync quest filters:', err)
        }
      })
    }
  })
}

watch(() => route.query, (nextQuery) => {
  const nextArchived = parseBooleanParam(nextQuery.archived)
  if (nextArchived !== showArchived.value) {
    showArchived.value = nextArchived
  }

  const nextStatuses = parseStatusQuery(nextQuery.status)
  if (!arraysEqual(nextStatuses, selectedStatuses.value)) {
    selectedStatuses.value = nextStatuses
  }

  const nextSearch = typeof nextQuery.search === 'string' ? nextQuery.search : ''
  if (nextSearch !== searchTerm.value) {
    searchTerm.value = nextSearch
    debouncedSearch.value = nextSearch.trim()
  }
})

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

const noResultsCopy = computed(() => {
  if (questsList.value.length === 0) {
    return 'No quests available yet.'
  }

  if (filteredQuests.value.length === 0) {
    return 'No quests match your filters.'
  }

  return null
})
</script>

<template>
  <v-container class="py-6">
    <QuestSubheader
      v-model:show-archived="showArchived"
      :can-toggle-archived="false"
    />

    <v-card class="mb-6">
      <v-card-text>
        <v-row class="gy-4">
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="searchTerm"
              label="Search quests"
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-select
              v-model="selectedStatuses"
              :items="questStatusOptions"
              label="Filter by status"
              multiple
              chips
              clearable
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="d-flex align-center"
          >
            <v-switch
              v-model="showArchived"
              inset
              color="secondary"
              hide-details
              label="Show archived"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-data-table
      :headers="questTableHeaders"
      :items="filteredQuests"
      item-key="id"
      :sort-by="tableSort"
      :items-per-page="10"
      class="quest-table"
      hover
    >
      <template #[`item.title`]="{ item }">
        <div class="quest-table__title">
          <div class="quest-table__title-text text-subtitle-2 font-weight-medium">
            {{ item.title }}
          </div>
          <div
            v-if="item.goal"
            class="text-caption text-medium-emphasis"
          >
            {{ item.goal }}
          </div>
        </div>
      </template>

      <template #[`item.status`]="{ item }">
        <v-chip
          size="small"
          variant="tonal"
          :color="statusColor(item.status)"
          class="text-uppercase font-weight-medium"
        >
          {{ formatStatusLabel(item.status) }}
        </v-chip>
      </template>

      <template #[`item.isPublic`]="{ item }">
        <v-chip
          size="small"
          color="primary"
          variant="outlined"
        >
          {{ item.isPublic ? 'Public' : 'Private' }}
        </v-chip>
      </template>

      <template #[`item.updatedAt`]="{ item }">
        {{ dateFormatter.format(new Date(item.updatedAt)) }}
      </template>

      <template #[`item.actions`]="{ item }">
        <div class="d-flex gap-2 justify-end">
          <v-btn
            variant="text"
            size="small"
            :to="`/quests/${item.id}`"
          >
            View
          </v-btn>
          <v-btn
            v-if="item.ownerId === currentUserId"
            variant="text"
            color="error"
            size="small"
            @click="openLifecycleDialog(item)"
          >
            Delete
          </v-btn>
        </div>
      </template>

      <template
        v-if="noResultsCopy"
        #no-data
      >
        <div class="py-8 text-center text-body-2 text-medium-emphasis">
          {{ noResultsCopy }}
        </div>
      </template>
    </v-data-table>

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
