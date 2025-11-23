<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { watchDebounced } from '@vueuse/core'
import { useTaskStore } from '~/stores/task'
import { TASK_STATUS, type TaskStatus } from '~/types/task'

definePageMeta({ middleware: ['auth'] })

const taskStore = useTaskStore()
const { tasks } = storeToRefs(taskStore)
const route = useRoute()
const router = useRouter()

const allowedStatuses = Object.values(TASK_STATUS)
type TaskViewFilter = 'completed'

const viewFilterStatusesMap: Record<TaskViewFilter, TaskStatus[]> = {
  completed: [TASK_STATUS.completed],
}

function parseStatusQuery(value: unknown): TaskStatus[] {
  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(',')
    .map(entry => entry.trim())
    .filter((entry): entry is TaskStatus => allowedStatuses.includes(entry as TaskStatus))
}

function arraysEqual<T>(first: T[], second: T[]): boolean {
  if (first.length !== second.length) {
    return false
  }
  return first.every((item, index) => item === second[index])
}

function parseViewFilter(value: unknown): TaskViewFilter | null {
  if (typeof value !== 'string') {
    return null
  }
  const normalized = value.toLowerCase()
  return normalized === 'completed' ? 'completed' : null
}

function statusesForView(view: TaskViewFilter | null): TaskStatus[] {
  return view ? viewFilterStatusesMap[view] : []
}

function statusesMatchView(statuses: TaskStatus[], view: TaskViewFilter | null) {
  if (!view) {
    return false
  }
  return arraysEqual(statuses, statusesForView(view))
}

function formatStatusLabel(status: TaskStatus) {
  return status
    .replace(/-/g, ' ')
    .replace(/^\w/, match => match.toUpperCase())
}

function formatQuestStatusLabel(status: string | null | undefined) {
  if (!status) {
    return 'Unknown status'
  }
  return status.replace(/^\w/, match => match.toUpperCase())
}

function normalizeRouteQuery(query: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {}
  const view = parseViewFilter(query.view)
  if (view) {
    normalized.view = view
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

const viewFilter = ref<TaskViewFilter | null>(parseViewFilter(route.query.view))
const initialStatuses = parseStatusQuery(route.query.status)
const selectedStatuses = ref<TaskStatus[]>(
  initialStatuses.length > 0 ? initialStatuses : statusesForView(viewFilter.value),
)
const searchTerm = ref(typeof route.query.search === 'string' ? route.query.search : '')
const debouncedSearch = ref(searchTerm.value.trim())

watchDebounced(searchTerm, (value) => {
  debouncedSearch.value = value.trim()
}, { debounce: 300, maxWait: 600 })

try {
  await taskStore.fetchTasks()
}
catch (error) {
  console.error('Failed to load tasks:', error)
}

const tasksList = computed(() => tasks.value ?? [])

const filteredTasks = computed(() => {
  const search = debouncedSearch.value.toLowerCase()
  const selected = selectedStatuses.value

  return tasksList.value.filter((task) => {
    const matchesStatus = selected.length === 0 || selected.includes(task.status as TaskStatus)
    const matchesSearch = search
      ? [
          task.title,
          task.details ?? '',
          task.extraContent ?? '',
          task.quest?.title ?? '',
        ].some(field => field?.toLowerCase().includes(search))
      : true

    return matchesStatus && matchesSearch
  })
})

const taskTableHeaders = [
  { title: 'Task', key: 'title', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Quest', key: 'quest', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
] as const

const statusColorMap: Record<TaskStatus, string> = {
  [TASK_STATUS.todo]: 'primary',
  [TASK_STATUS.pending]: 'amber',
  [TASK_STATUS.inProgress]: 'primary',
  [TASK_STATUS.completed]: 'success',
  [TASK_STATUS.draft]: 'grey-darken-1',
}

function statusColor(status: TaskStatus) {
  return statusColorMap[status] ?? 'secondary'
}

function normalizeTaskStatus(value: string): TaskStatus {
  return allowedStatuses.includes(value as TaskStatus)
    ? value as TaskStatus
    : TASK_STATUS.todo
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const tableSort = ref([{ key: 'createdAt', order: 'desc' as const }])

const queryState = computed(() => {
  const query: Record<string, string> = {}
  if (viewFilter.value) {
    query.view = viewFilter.value
  }
  if (selectedStatuses.value.length > 0 && !statusesMatchView(selectedStatuses.value, viewFilter.value)) {
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
          console.error('Failed to sync task filters:', err)
        }
      })
    }
  })
}

watch(() => route.query, (nextQuery) => {
  const nextView = parseViewFilter(nextQuery.view)
  if (nextView !== viewFilter.value) {
    viewFilter.value = nextView
  }

  const nextStatusesFromQuery = parseStatusQuery(nextQuery.status)
  const nextStatuses = nextStatusesFromQuery.length > 0
    ? nextStatusesFromQuery
    : statusesForView(nextView)
  if (!arraysEqual(nextStatuses, selectedStatuses.value)) {
    selectedStatuses.value = nextStatuses
  }

  const nextSearch = typeof nextQuery.search === 'string' ? nextQuery.search : ''
  if (nextSearch !== searchTerm.value) {
    searchTerm.value = nextSearch
    debouncedSearch.value = nextSearch.trim()
  }
})

watch(selectedStatuses, (nextStatuses) => {
  if (viewFilter.value && !statusesMatchView(nextStatuses, viewFilter.value)) {
    viewFilter.value = null
  }
})

const noResultsCopy = computed(() => {
  if (tasksList.value.length === 0) {
    return 'No tasks available yet.'
  }

  if (filteredTasks.value.length === 0) {
    return 'No tasks match your filters.'
  }

  return null
})
</script>

<template>
  <v-container class="py-6">
    <TaskHeader
      title="Tasks"
      description="Review and manage tasks across all your quests."
      action-label="Go to Quests"
      action-to="/quests"
      action-icon="mdi-format-list-bulleted-square"
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
              label="Search tasks"
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-select
              v-model="selectedStatuses"
              :items="allowedStatuses.map(status => ({ title: formatStatusLabel(status), value: status }))"
              label="Filter by status"
              multiple
              chips
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-data-table
      :headers="taskTableHeaders"
      :items="filteredTasks"
      :loading="taskStore.loading"
      item-key="id"
      :sort-by="tableSort"
      :items-per-page="10"
      class="tasks-table"
      hover
    >
      <template #[`item.title`]="{ item }">
        <div class="d-flex flex-column gap-1">
          <div class="text-subtitle-2 font-weight-medium">
            {{ item.title }}
          </div>
          <div
            v-if="item.details"
            class="text-caption text-medium-emphasis"
          >
            {{ item.details }}
          </div>
        </div>
      </template>

      <template #[`item.status`]="{ item }">
        <v-chip
          size="small"
          variant="tonal"
          :color="statusColor(normalizeTaskStatus(item.status))"
          class="text-uppercase font-weight-medium"
        >
          {{ formatStatusLabel(normalizeTaskStatus(item.status)) }}
        </v-chip>
      </template>

      <template #[`item.quest`]="{ item }">
        <div class="d-flex flex-column gap-1">
          <div class="text-subtitle-2 font-weight-medium">
            {{ item.quest?.title ?? 'Unknown quest' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Status: {{ formatQuestStatusLabel(item.quest?.status) }}
          </div>
        </div>
      </template>

      <template #[`item.createdAt`]="{ item }">
        {{ dateFormatter.format(new Date(item.createdAt)) }}
      </template>

      <template #[`item.actions`]="{ item }">
        <div class="d-flex gap-2 justify-center">
          <v-btn
            variant="text"
            size="small"
            :to="`/quests/${item.questId}`"
          >
            Quest
          </v-btn>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            :to="`/quests/${item.questId}?task=${item.id}`"
          >
            View Task
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
  </v-container>
</template>
