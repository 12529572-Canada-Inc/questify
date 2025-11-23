<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMetrics } from '~/composables/useMetrics'
import type { UserMetrics } from '~/types/metrics'
import { useUserStore } from '~/stores/user'

definePageMeta({
  middleware: ['auth'],
})

const DEFAULT_METRICS: UserMetrics = {
  totalQuests: 0,
  activeQuests: 0,
  completedQuests: 0,
  publicQuests: 0,
  privateQuests: 0,
  totalTasks: 0,
  completedTasks: 0,
  completionRate: 0,
  lastActiveAt: null,
}

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const {
  data: metricsData,
  pending,
  error,
  refresh,
} = await useMetrics()

const metrics = computed<UserMetrics>(() => metricsData.value ?? DEFAULT_METRICS)

const questMetrics = computed(() => [
  {
    key: 'total',
    label: 'Total Quests',
    icon: 'mdi-compass-rose',
    value: metrics.value.totalQuests,
    to: '/quests',
  },
  {
    key: 'active',
    label: 'Active Quests',
    icon: 'mdi-sword-cross',
    value: metrics.value.activeQuests,
    to: '/quests?view=active',
  },
  {
    key: 'completed',
    label: 'Completed Quests',
    icon: 'mdi-check-circle',
    value: metrics.value.completedQuests,
    to: '/quests?view=completed',
  },
])

const taskMetrics = computed(() => [
  {
    key: 'tasks-total',
    label: 'Total Tasks',
    icon: 'mdi-clipboard-text',
    value: metrics.value.totalTasks,
    to: '/tasks',
  },
  {
    key: 'tasks-completed',
    label: 'Completed Tasks',
    icon: 'mdi-clipboard-check',
    value: metrics.value.completedTasks,
    to: '/tasks/completed',
  },
  {
    key: 'visibility',
    label: 'Private vs Public',
    icon: 'mdi-lock-open-variant',
    value: `${metrics.value.privateQuests}/${metrics.value.publicQuests}`,
    to: '/quests',
  },
])

const completionPercentage = computed(() => Math.round(metrics.value.completionRate * 100))

const lastActiveLabel = computed(() => {
  if (!metrics.value.lastActiveAt) {
    return 'No recent quest activity yet.'
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(metrics.value.lastActiveAt))
  }
  catch {
    return 'Activity date unavailable'
  }
})

const welcomeName = computed(() => user.value?.name || user.value?.email || 'Adventurer')
const metricsPending = computed(() => pending.value)
const metricsError = computed(() => error.value?.message ?? null)

const quickLinks = [
  {
    key: 'private',
    title: 'Private Quests',
    description: 'Review and manage the quests you own.',
    icon: 'mdi-shield-check',
    to: '/quests',
    color: 'primary',
  },
  {
    key: 'public',
    title: 'Public Quests',
    description: 'Explore community quests and track new challenges.',
    icon: 'mdi-earth',
    to: '/quests/public',
    color: 'secondary',
  },
]

async function handleRefresh() {
  await refresh()
}
</script>

<template>
  <v-container class="py-6">
    <div class="dashboard">
      <v-alert
        v-if="metricsError"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="handleRefresh"
      >
        {{ metricsError }}
      </v-alert>

      <v-card
        class="dashboard__welcome"
        elevation="2"
      >
        <v-card-text class="d-flex flex-column flex-md-row align-center justify-space-between gap-6">
          <div class="dashboard__welcome-left">
            <h1 class="text-h5 text-md-h4 font-weight-bold mb-2">
              Hello,
              <br>
              {{ welcomeName }}
            </h1>
            <p class="text-body-1 text-medium-emphasis mb-0">
              Here is the latest snapshot of your quest progress.
            </p>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Last active: {{ lastActiveLabel }}
            </p>
          </div>

          <div class="d-flex flex-column flex-sm-row gap-3">
            <v-btn
              color="primary"
              class="dashboard__primary-action"
              size="large"
              to="/quests/new"
            >
              <v-icon
                icon="mdi-plus"
                start
              />
              Start New Quest
            </v-btn>
            <v-btn
              color="secondary"
              variant="tonal"
              size="large"
              to="/quests"
            >
              <v-icon
                icon="mdi-format-list-bulleted-square"
                start
              />
              Manage Quests
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-row
        class="mt-4"
        dense
      >
        <v-col
          v-for="link in quickLinks"
          :key="link.key"
          cols="12"
          md="6"
        >
          <v-card
            :to="link.to"
            class="dashboard__quick-link"
            hover
          >
            <v-card-text class="d-flex align-center gap-4">
              <v-avatar
                :color="link.color"
                size="48"
                variant="tonal"
              >
                <v-icon :icon="link.icon" />
              </v-avatar>
              <div class="d-flex flex-column gap-1">
                <span class="text-subtitle-1 font-weight-medium">
                  {{ link.title }}
                </span>
                <span class="text-body-2 text-medium-emphasis">
                  {{ link.description }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row
        class="mt-2"
        dense
      >
        <v-col
          cols="12"
          lg="8"
        >
          <v-card
            class="dashboard__metrics-card"
            elevation="2"
          >
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1 font-weight-medium">
                Quest Overview
              </span>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                :loading="metricsPending"
                @click="handleRefresh"
              >
                Refresh
              </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col
                  v-for="metric in questMetrics"
                  :key="metric.key"
                  cols="12"
                  sm="4"
                >
                  <NuxtLink
                    :to="metric.to"
                    class="dashboard__metric"
                    :aria-label="metric.label"
                  >
                    <v-icon
                      :icon="metric.icon"
                      size="28"
                      class="dashboard__metric-icon"
                    />
                    <div class="dashboard__metric-content">
                      <span class="text-h5 font-weight-bold">
                        <v-skeleton-loader
                          v-if="metricsPending"
                          type="heading"
                          class="dashboard__metric-skeleton"
                        />
                        <template v-else>
                          {{ metric.value }}
                        </template>
                      </span>
                      <span class="text-body-2 text-medium-emphasis">
                        {{ metric.label }}
                      </span>
                    </div>
                  </NuxtLink>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          lg="4"
        >
          <v-card
            class="dashboard__completion-card"
            elevation="2"
          >
            <v-card-text class="d-flex flex-column align-center text-center gap-3">
              <span class="text-subtitle-1 font-weight-medium">
                Completion Rate
              </span>
              <div class="dashboard__completion-progress">
                <v-progress-circular
                  :model-value="metricsPending ? 0 : completionPercentage"
                  :size="128"
                  :width="12"
                  color="success"
                  rotate="90"
                >
                  <span class="text-h5 font-weight-bold">
                    <template v-if="metricsPending">
                      <v-skeleton-loader type="heading" />
                    </template>
                    <template v-else>
                      {{ completionPercentage }}%
                    </template>
                  </span>
                </v-progress-circular>
              </div>
              <span class="text-body-2 text-medium-emphasis">
                Based on {{ metrics.totalTasks }} tasks across your quests.
              </span>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card
        class="dashboard__tasks-card mt-4"
        elevation="2"
      >
        <v-card-title>
          <span class="text-subtitle-1 font-weight-medium">
            Task Highlights
          </span>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-row>
            <v-col
              v-for="metric in taskMetrics"
              :key="metric.key"
              cols="12"
              sm="4"
            >
              <NuxtLink
                :to="metric.to"
                class="dashboard__metric dashboard__metric--compact"
                :aria-label="metric.label"
              >
                <v-icon
                  :icon="metric.icon"
                  size="24"
                  class="dashboard__metric-icon"
                />
                <div class="dashboard__metric-content">
                  <span class="text-h6 font-weight-bold">
                    <v-skeleton-loader
                      v-if="metricsPending"
                      type="heading"
                      class="dashboard__metric-skeleton"
                    />
                    <template v-else>
                      {{ metric.value }}
                    </template>
                  </span>
                  <span class="text-body-2 text-medium-emphasis">
                    {{ metric.label }}
                  </span>
                </div>
              </NuxtLink>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard__welcome {
  border: 1px solid rgba(43, 97, 177, 0.16);
}

.dashboard__primary-action {
  min-width: 200px;
}

.dashboard__quick-link {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.dashboard__quick-link:hover {
  transform: translateY(-2px);
}

.dashboard__metrics-card,
.dashboard__completion-card,
.dashboard__tasks-card {
  height: 100%;
}

.dashboard__metric {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s ease, transform 0.15s ease;
  border-radius: 8px;
  padding: 8px 6px;
}

.dashboard__metric--compact .dashboard__metric-icon {
  margin-top: 4px;
}

.dashboard__metric-icon {
  color: rgb(var(--v-theme-primary));
}

.dashboard__metric-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dashboard__metric:hover {
  background: rgba(var(--v-theme-primary), 0.08);
  transform: translateY(-1px);
}

.dashboard__metric-skeleton {
  width: 48px;
  margin: 0;
}

.dashboard__completion-progress {
  display: flex;
  justify-content: center;
}

@media (max-width: 960px) {
  .dashboard__welcome {
    text-align: center;
  }

  .dashboard__primary-action {
    width: 100%;
  }
}
</style>
