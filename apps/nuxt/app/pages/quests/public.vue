<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { QuestStatus } from '@prisma/client'
import type { PublicQuestsResponse, PublicQuestSort } from '~/types/public-quests'
import {
  PUBLIC_QUEST_SORT_OPTIONS,
  PUBLIC_QUEST_STATUS_FILTERS,
  normalizePublicQuestSort,
  normalizePublicQuestStatuses,
} from '~/types/public-quests'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()

function parsePageParam(value: unknown): number {
  if (Array.isArray(value)) {
    return parsePageParam(value[0])
  }

  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

function normalizeRouteQuery(query: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, rawValue] of Object.entries(query)) {
    if (Array.isArray(rawValue)) {
      if (rawValue.length > 0 && typeof rawValue[0] !== 'undefined') {
        result[key] = `${rawValue[0]}`
      }
      continue
    }

    if (typeof rawValue === 'string') {
      result[key] = rawValue
    }
    else if (rawValue != null) {
      result[key] = `${rawValue}`
    }
  }

  return result
}

function isShallowEqualRecord(a: Record<string, string>, b: Record<string, string>): boolean {
  const aEntries = Object.entries(a).sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
  const bEntries = Object.entries(b).sort(([aKey], [bKey]) => aKey.localeCompare(bKey))

  if (aEntries.length !== bEntries.length) {
    return false
  }

  return aEntries.every(([key, value], index) => {
    const otherEntry = bEntries[index]

    if (!otherEntry) {
      return false
    }

    const [otherKey, otherValue] = otherEntry
    return key === otherKey && value === otherValue
  })
}

function arraysEqual<T>(first: T[], second: T[]): boolean {
  if (first.length !== second.length) {
    return false
  }

  const a = [...first].sort()
  const b = [...second].sort()

  return a.every((value, index) => value === b[index])
}

const currentPage = ref(parsePageParam(route.query.page))
const searchTerm = ref(typeof route.query.search === 'string' ? route.query.search : '')
const debouncedSearch = ref(searchTerm.value.trim())
const selectedSort = ref<PublicQuestSort>(normalizePublicQuestSort(route.query.sort))
const selectedStatuses = ref<QuestStatus[]>(normalizePublicQuestStatuses(route.query.status))

const statusQuery = computed(() => selectedStatuses.value.join(','))

watch(selectedSort, () => {
  currentPage.value = 1
})

watch(selectedStatuses, () => {
  currentPage.value = 1
})

watchDebounced(searchTerm, (value) => {
  const trimmed = value.trim()
  debouncedSearch.value = trimmed
  currentPage.value = 1
}, { debounce: 400, maxWait: 800 })

function createDefaultResponse(): PublicQuestsResponse {
  return {
    data: [],
    meta: {
      page: 1,
      pageSize: 0,
      total: 0,
      totalPages: 1,
      sort: 'newest',
      search: null,
      status: null,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }
}

const { data: responseData, pending, error, refresh } = await useAsyncData<PublicQuestsResponse>(
  'public-quests',
  () => $fetch<PublicQuestsResponse>('/api/quests/public', {
    params: {
      page: currentPage.value,
      sort: selectedSort.value,
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
      ...(statusQuery.value ? { status: statusQuery.value } : {}),
    },
  }),
  {
    default: () => createDefaultResponse(),
    watch: [
      currentPage,
      selectedSort,
      debouncedSearch,
      statusQuery,
    ],
  },
)

const response = computed<PublicQuestsResponse>(() => responseData.value ?? createDefaultResponse())

const quests = computed(() => response.value.data)
const meta = computed(() => response.value.meta)

const totalPages = computed(() => Math.max(1, meta.value.totalPages || 1))

const resultSummary = computed(() => {
  const total = meta.value.total

  if (pending.value) {
    return 'Loading public quests...'
  }

  if (total === 0) {
    return 'No public quests found'
  }

  if (total === 1) {
    return 'Showing 1 public quest'
  }

  return `Showing ${total} public quests`
})

const filtersActive = computed(() => {
  return Boolean(debouncedSearch.value) || selectedStatuses.value.length > 0 || selectedSort.value !== 'newest'
})

function resetFilters() {
  searchTerm.value = ''
  debouncedSearch.value = ''
  selectedStatuses.value = []
  selectedSort.value = 'newest'
}

const queryState = computed<Record<string, string>>(() => {
  const query: Record<string, string> = {}

  if (currentPage.value > 1) {
    query.page = String(currentPage.value)
  }

  if (debouncedSearch.value) {
    query.search = debouncedSearch.value
  }

  if (selectedSort.value !== 'newest') {
    query.sort = selectedSort.value
  }

  if (statusQuery.value) {
    query.status = statusQuery.value
  }

  return query
})

if (import.meta.client) {
  watch(queryState, (nextQuery) => {
    const currentQuery = normalizeRouteQuery(route.query as Record<string, unknown>)

    if (!isShallowEqualRecord(currentQuery, nextQuery)) {
      router.replace({ path: route.path, query: nextQuery }).catch((err) => {
        if (import.meta.dev) {
          console.error('Failed to update public quests query params:', err)
        }
      })
    }
  })
}

watch(() => route.query, (nextQuery) => {
  const nextSort = normalizePublicQuestSort(nextQuery.sort)
  if (nextSort !== selectedSort.value) {
    selectedSort.value = nextSort
  }

  const nextSearch = typeof nextQuery.search === 'string' ? nextQuery.search : ''

  if (nextSearch !== searchTerm.value) {
    searchTerm.value = nextSearch
    debouncedSearch.value = nextSearch.trim()
  }

  const nextStatuses = normalizePublicQuestStatuses(nextQuery.status)
  if (!arraysEqual(nextStatuses, selectedStatuses.value)) {
    selectedStatuses.value = nextStatuses
  }

  const nextPage = parsePageParam(nextQuery.page)
  if (nextPage !== currentPage.value) {
    currentPage.value = nextPage
  }
})

const errorMessage = computed(() => {
  if (!error.value) {
    return null
  }

  if (error.value instanceof Error) {
    return error.value.message
  }

  return 'Failed to load public quests.'
})
</script>

<template>
  <v-container class="py-8 public-quests-page">
    <v-row class="align-center mb-6">
      <v-col
        cols="12"
        md="8"
      >
        <h1 class="text-h4 font-weight-bold text-white mb-2">
          Public Quests
        </h1>
        <p class="result-summary">
          {{ resultSummary }}
        </p>
      </v-col>
      <v-col
        cols="12"
        md="4"
        class="d-flex justify-md-end justify-start"
      >
        <v-btn
          color="primary"
          class="w-100 w-md-auto"
          :to="{ path: '/quests/new', query: { public: 'true' } }"
        >
          Create public quest
        </v-btn>
      </v-col>
    </v-row>

    <v-card
      class="mb-6"
    >
      <v-card-text>
        <v-row class="gy-4 gx-4">
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="searchTerm"
              label="Search quests"
              density="comfortable"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            md="3"
          >
            <v-select
              v-model="selectedSort"
              :items="PUBLIC_QUEST_SORT_OPTIONS"
              item-title="label"
              item-value="value"
              label="Sort by"
              density="comfortable"
              hide-details
              :clearable="false"
            />
          </v-col>
          <v-col
            cols="12"
            md="3"
          >
            <v-select
              v-model="selectedStatuses"
              :items="PUBLIC_QUEST_STATUS_FILTERS"
              item-title="label"
              item-value="value"
              label="Filter by status"
              multiple
              chips
              clearable
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <div
      v-if="errorMessage"
      class="mb-6"
    >
      <v-alert
        type="error"
        variant="tonal"
        border="start"
        title="Unable to load quests"
      >
        {{ errorMessage }}
        <template #append>
          <v-btn
            variant="text"
            color="error"
            @click="refresh"
          >
            Retry
          </v-btn>
        </template>
      </v-alert>
    </div>

    <v-row
      v-else-if="pending"
      class="gy-4 gx-4"
    >
      <v-col
        v-for="index in 6"
        :key="`skeleton-${index}`"
        cols="12"
        sm="6"
        md="4"
      >
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <div
      v-else-if="quests.length === 0"
      class="public-quests-page__empty"
    >
      <v-icon
        icon="mdi-map-search-outline"
        size="48"
        color="primary"
        class="mb-3"
      />
      <h2 class="text-h6 text-white mb-2">
        No quests match your filters yet
      </h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Try adjusting your search or check back soon to see what the community is sharing.
      </p>
      <v-btn
        v-if="filtersActive"
        variant="tonal"
        color="primary"
        @click="resetFilters"
      >
        Clear filters
      </v-btn>
    </div>

    <v-row
      v-else
      class="gy-4 gx-4"
    >
      <v-col
        v-for="quest in quests"
        :key="quest.id"
        cols="12"
        sm="6"
        md="4"
      >
        <PublicQuestCard :quest="quest" />
      </v-col>
    </v-row>

    <div
      v-if="quests.length > 0 && totalPages > 1"
      class="d-flex justify-center mt-8"
    >
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        color="primary"
        rounded="circle"
        :disabled="pending"
      />
    </div>
  </v-container>
</template>

<style scoped>
.public-quests-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 16px;
  border-radius: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.25);
  border: 1px dashed rgba(var(--v-theme-outline), 0.25);
}

.result-summary {
  font-size: 1rem;
  /* TODO: Update color to match design */
  color: white;
}
</style>
