<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { breakpointsVuetifyV3, useBreakpoints, useVModel, useWindowSize } from '@vueuse/core'
import type { QuestTaskSection, QuestTaskTab, TaskWithInvestigations } from '~/types/quest-tasks'

const props = defineProps<{
  modelValue: QuestTaskTab
  sections: QuestTaskSection[]
  pending: boolean
  tasksLoading: boolean
  isOwner: boolean
  hasTasks: boolean
  investigatingTaskIds?: string[]
  highlightedTaskId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: QuestTaskTab): void
  (e: 'edit-task' | 'investigate-task' | 'share-task', task: TaskWithInvestigations): void
}>()

const taskTab = useVModel(props, 'modelValue', emit)
const investigatingIds = computed(() => new Set(props.investigatingTaskIds ?? []))
const expandedInvestigationId = ref<string | null>(null)
const highlightedTaskId = computed(() => props.highlightedTaskId ?? null)

const breakpoints = useBreakpoints(breakpointsVuetifyV3)
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const smOrEqualMd = breakpoints.smallerOrEqual('md')
const compactActions = computed(() => (isMounted.value ? smOrEqualMd.value : false))

const { width: windowWidth } = useWindowSize()
const hideOwnerActions = computed(() => (isMounted.value ? windowWidth.value < 500 : false))

function hasPendingInvestigation(task: TaskWithInvestigations) {
  return task.investigations.some(inv => inv.status === 'pending')
    || investigatingIds.value.has(task.id)
}

function toggleInvestigationExpansion(investigationId: string) {
  expandedInvestigationId.value = expandedInvestigationId.value === investigationId
    ? null
    : investigationId
}
</script>

<template>
  <div>
    <h3 class="text-h6 mb-2">
      Tasks
    </h3>

    <div
      v-if="pending || tasksLoading"
      class="d-flex align-center gap-3 py-4"
    >
      <v-progress-circular
        color="primary"
        indeterminate
        class="mr-2"
      />
      <span class="text-body-2">Generating tasks for this quest...</span>
    </div>

    <template v-else>
      <template v-if="hasTasks">
        <v-tabs
          v-model="taskTab"
          density="comfortable"
          color="primary"
        >
          <v-tab
            v-for="section in sections"
            :key="section.value"
            :value="section.value"
          >
            {{ section.title }} ({{ section.tasks.length }})
          </v-tab>
        </v-tabs>

        <v-tabs-window
          v-model="taskTab"
          class="mt-4"
        >
          <v-tabs-window-item
            v-for="section in sections"
            :key="section.value"
            :value="section.value"
          >
            <QuestTaskSection
              :section="section"
              :is-owner="isOwner"
              :pending="pending"
              :compact-actions="compactActions"
              :hide-owner-actions="hideOwnerActions"
              :highlighted-task-id="highlightedTaskId"
              :expanded-investigation-id="expandedInvestigationId"
              :has-pending-investigation="hasPendingInvestigation"
              @share-task="emit('share-task', $event)"
              @investigate-task="emit('investigate-task', $event)"
              @edit-task="emit('edit-task', $event)"
              @toggle-investigation="toggleInvestigationExpansion"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </template>
      <p
        v-else
        class="text-body-2 text-medium-emphasis"
      >
        No tasks have been generated for this quest yet.
      </p>
    </template>
  </div>
</template>
