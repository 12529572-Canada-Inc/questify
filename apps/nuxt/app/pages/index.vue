<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { Quest } from '@prisma/client'
import { useUserStore } from '~/stores/user'

type PublicQuest = Quest & {
  owner: {
    id: string
    name: string | null
    email: string
  }
  taskCounts: {
    total: number
    todo: number
    inProgress: number
    completed: number
  }
}

const userStore = useUserStore()
const { loggedIn } = storeToRefs(userStore)

if (!loggedIn.value) {
  await userStore.fetchSession().catch(() => null)
}

if (loggedIn.value) {
  await navigateTo('/dashboard', { replace: true })
}

const publicQuests = ref<PublicQuest[]>([])
const loading = ref(true)
const sortBy = ref<'createdAt' | 'updatedAt'>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

async function fetchPublicQuests() {
  loading.value = true
  try {
    const data = await $fetch('/api/quests/public', {
      query: {
        sortBy: sortBy.value,
        order: sortOrder.value,
      },
    })
    publicQuests.value = data as PublicQuest[]
  }
  catch (error) {
    console.error('Failed to fetch public quests:', error)
  }
  finally {
    loading.value = false
  }
}

if (!loggedIn.value) {
  onMounted(() => {
    fetchPublicQuests()
  })
}

// function handleSortChange() {
//   fetchPublicQuests()
// }
</script>

<template>
  <div class="home-page">
    <HomeHeroCard />

    <!-- TODO: create a page for public quests -->
    <!-- <v-container class="public-quests-section mt-8">
      <div class="d-flex align-center justify-space-between mb-4">
        <h2 class="text-h4 font-weight-bold">
          Discover Public Quests
        </h2>
        <div class="d-flex align-center gap-2">
          <v-select
            v-model="sortBy"
            :items="[
              { value: 'createdAt', title: 'Created Date' },
              { value: 'updatedAt', title: 'Updated Date' },
            ]"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="handleSortChange"
          />
          <v-btn-toggle
            v-model="sortOrder"
            mandatory
            density="compact"
            @update:model-value="handleSortChange"
          >
            <v-btn
              value="desc"
              icon="mdi-sort-descending"
            />
            <v-btn
              value="asc"
              icon="mdi-sort-ascending"
            />
          </v-btn-toggle>
        </div>
      </div>

      <div
        v-if="loading"
        class="d-flex justify-center py-8"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>

      <div
        v-else-if="publicQuests.length === 0"
        class="text-center py-8 text-medium-emphasis"
      >
        <v-icon
          icon="mdi-earth-off"
          size="64"
          class="mb-4"
        />
        <p class="text-h6">
          No public quests available yet
        </p>
        <p>Check back later or create your own quest!</p>
      </div>

      <v-row v-else>
        <v-col
          v-for="quest in publicQuests"
          :key="quest.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            :to="`/quests/${quest.id}`"
            hover
            class="public-quest-card"
          >
            <v-card-title class="d-flex align-center gap-2">
              <span class="text-truncate">{{ quest.title }}</span>
              <v-chip
                size="x-small"
                color="success"
                variant="tonal"
                prepend-icon="mdi-earth"
              >
                Public
              </v-chip>
            </v-card-title>
            <v-card-subtitle class="d-flex align-center gap-1">
              <v-icon
                icon="mdi-account"
                size="small"
              />
              {{ quest.owner.name || quest.owner.email }}
            </v-card-subtitle>
            <v-card-text>
              <div
                v-if="quest.goal"
                class="mb-2 text-truncate-2"
              >
                {{ quest.goal }}
              </div>
              <div class="d-flex flex-wrap gap-2 mt-2">
                <v-chip
                  size="small"
                  variant="outlined"
                  prepend-icon="mdi-checkbox-multiple-marked"
                >
                  {{ quest.taskCounts.total }} tasks
                </v-chip>
                <v-chip
                  v-if="quest.taskCounts.completed > 0"
                  size="small"
                  color="success"
                  variant="tonal"
                >
                  {{ quest.taskCounts.completed }} done
                </v-chip>
                <v-chip
                  size="small"
                  :color="quest.status === 'completed' ? 'success' : 'primary'"
                  variant="tonal"
                >
                  {{ quest.status }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container> -->
  </div>
</template>

<style scoped>
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.public-quest-card {
  height: 100%;
  transition: transform 0.2s;
}

.public-quest-card:hover {
  transform: translateY(-4px);
}
</style>
