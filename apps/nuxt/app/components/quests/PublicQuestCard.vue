<script setup lang="ts">
import { computed } from 'vue'
import type { PublicQuestSummary } from '~/types/public-quests'

const props = defineProps<{
  quest: PublicQuestSummary
}>()

const ownerName = computed(() => props.quest.owner?.name?.trim() || 'Anonymous Adventurer')

const summary = computed(() => {
  const { goal, context, constraints } = props.quest
  return goal?.trim() || context?.trim() || constraints?.trim() || ''
})

const hasSummary = computed(() => summary.value.length > 0)

const statusColor = computed(() => {
  switch (props.quest.status) {
    case 'completed':
      return 'success'
    case 'active':
      return 'primary'
    case 'failed':
      return 'error'
    case 'draft':
      return 'amber-darken-2'
    default:
      return 'secondary'
  }
})

const statusLabel = computed(() => props.quest.status.replace(/^\w/, match => match.toUpperCase()))

const createdFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const updatedFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const createdAtLabel = computed(() => {
  return createdFormatter.format(new Date(props.quest.createdAt))
})

const updatedAtLabel = computed(() => {
  return updatedFormatter.format(new Date(props.quest.updatedAt))
})

const totalTasks = computed(() => props.quest.taskCounts.total)
const completedTasks = computed(() => props.quest.taskCounts.completed)

const completionPercent = computed(() => {
  const total = totalTasks.value
  return total > 0 ? Math.round((completedTasks.value / total) * 100) : 0
})

const completionLabel = computed(() => {
  const total = totalTasks.value
  if (total === 0) {
    return 'No tasks yet'
  }

  return `${completedTasks.value} of ${total} tasks completed`
})
</script>

<template>
  <v-card
    class="public-quest-card"
  >
    <v-card-item>
      <template #prepend>
        <v-avatar
          color="secondary"
        >
          <v-icon icon="mdi-compass-outline" />
        </v-avatar>
      </template>
      <v-card-title class="text-wrap">
        {{ quest.title }}
      </v-card-title>
      <v-card-subtitle class="d-flex align-center gap-2 flex-wrap">
        <v-chip
          size="small"
          class="text-uppercase font-weight-medium"
          :color="statusColor"
        >
          {{ statusLabel }}
        </v-chip>
        <span class="text-caption text-medium-emphasis">
          Updated {{ updatedAtLabel }}
        </span>
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="public-quest-card__body">
      <div class="public-quest-card__owner text-body-2">
        <v-icon
          icon="mdi-account-circle-outline"
          size="20"
          class="mr-2"
        />
        <span>{{ ownerName }}</span>
      </div>

      <div class="public-quest-card__description">
        <TextWithLinks
          v-if="hasSummary"
          tag="p"
          class="text-body-2 text-medium-emphasis mb-0"
          :text="summary"
        />
        <p
          v-else
          class="text-body-2 text-medium-emphasis mb-0"
          style="font-style: italic;"
        >
          No goal has been shared yet.
        </p>
      </div>

      <v-divider class="my-4" />

      <div class="public-quest-card__meta">
        <div class="public-quest-card__meta-item">
          <span class="text-caption text-medium-emphasis">Created</span>
          <span class="text-body-2 font-weight-medium">{{ createdAtLabel }}</span>
        </div>
        <div class="public-quest-card__meta-item">
          <span class="text-caption text-medium-emphasis">Progress</span>
          <span class="text-body-2 font-weight-medium">{{ completionLabel }}</span>
        </div>
      </div>

      <v-progress-linear
        :model-value="completionPercent"
        height="6"
        color="primary"
        class="mt-2"
      />
    </v-card-text>

    <v-card-actions class="public-quest-card__actions">
      <v-btn
        color="primary"
        :to="`/quests/${quest.id}`"
      >
        View Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.public-quest-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.public-quest-card__body {
  flex: 1;
}

.public-quest-card__owner {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: rgba(var(--v-theme-on-surface));
}

.public-quest-card__description {
  min-height: 64px;
}

.public-quest-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.public-quest-card__meta-item {
  display: flex;
  flex-direction: column;
}

.public-quest-card__actions {
  justify-content: flex-end;
  padding-bottom: 16px;
}
</style>
