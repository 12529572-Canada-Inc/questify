<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import type { Task } from '@prisma/client'

type TaskTab = 'todo' | 'completed'

type QuestTaskSectionAction = {
  label: string
  color: string
  handler: (taskId: string) => void
}

type QuestTaskSection = {
  value: TaskTab
  title: string
  color: string
  tasks: Task[]
  completed: boolean
  emptyMessage: string
  action?: QuestTaskSectionAction | null
}

const props = defineProps<{
  modelValue: TaskTab
  sections: QuestTaskSection[]
  pending: boolean
  tasksLoading: boolean
  isOwner: boolean
  hasTasks: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TaskTab): void
}>()

const taskTab = useVModel(props, 'modelValue', emit)
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
            <v-card
              variant="tonal"
              :color="section.color"
              class="elevation-0"
            >
              <v-card-title class="text-subtitle-1 font-weight-medium">
                {{ section.title }}
              </v-card-title>
              <v-divider />
              <div class="pa-4 pt-0">
                <template v-if="section.tasks.length">
                  <v-list
                    lines="three"
                    density="comfortable"
                    class="py-0"
                  >
                    <v-list-item
                      v-for="task in section.tasks"
                      :key="task.id"
                      class="py-3"
                    >
                      <template #title>
                        <span
                          class="text-body-1 font-weight-medium"
                          :class="section.completed ? ['text-medium-emphasis', 'task--completed'] : []"
                        >
                          {{ task.title }}
                        </span>
                      </template>
                      <template #subtitle>
                        <div
                          class="d-flex flex-column"
                          style="gap: 4px;"
                        >
                          <TextWithLinks
                            v-if="task.details"
                            :class="section.completed ? 'text-body-2 text-medium-emphasis task--completed' : 'text-body-2'"
                            tag="div"
                            :text="task.details"
                          />
                          <span
                            class="text-body-2"
                            :class="section.completed ? ['text-medium-emphasis', 'task--completed'] : 'text-medium-emphasis'"
                          >
                            Status: {{ task.status }}
                          </span>
                        </div>
                      </template>
                      <template #append>
                        <v-btn
                          v-if="isOwner && section.action"
                          size="small"
                          :color="section.action.color"
                          variant="text"
                          @click="section.action.handler(task.id)"
                        >
                          {{ section.action.label }}
                        </v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </template>
                <p
                  v-else
                  class="text-body-2 text-medium-emphasis mb-0"
                >
                  {{ section.emptyMessage }}
                </p>
              </div>
            </v-card>
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

<style scoped>
.task--completed {
  text-decoration: line-through;
}
</style>
