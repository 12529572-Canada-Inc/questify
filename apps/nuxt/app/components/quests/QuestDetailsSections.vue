<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  quest: Partial<Record<'goal' | 'context' | 'constraints', string | null>> | null
  fallbackMessage?: string
}>()

const { sections, hasDetails } = useQuestDetails(props.quest, {
  labels: {
    goal: 'Desired Outcome',
    context: 'Context',
    constraints: 'Constraints & Preferences',
  },
})

const sectionConfig = {
  goal: {
    icon: 'mdi-bullseye-arrow',
    color: 'primary',
  },
  context: {
    icon: 'mdi-map-marker-radius-outline',
    color: 'info',
  },
  constraints: {
    icon: 'mdi-shield-check-outline',
    color: 'warning',
  },
} as const

const decoratedSections = computed(() => sections.value.map(section => ({
  ...section,
  icon: sectionConfig[section.key].icon,
  color: sectionConfig[section.key].color,
})))
</script>

<template>
  <template v-if="hasDetails">
    <v-list
      class="quest-details-list py-0"
      density="comfortable"
      lines="two"
    >
      <v-list-item
        v-for="section in decoratedSections"
        :key="section.key"
        class="quest-details-item"
      >
        <template #prepend>
          <v-avatar
            size="40"
            variant="tonal"
            :color="section.color"
          >
            <v-icon
              :icon="section.icon"
              size="22"
            />
          </v-avatar>
        </template>
        <template #title>
          <span class="text-subtitle-1 font-weight-medium">
            {{ section.label }}
          </span>
        </template>
        <template #subtitle>
          <TextWithLinks
            class="text-body-2 mb-0"
            tag="div"
            :text="section.text"
          />
        </template>
      </v-list-item>
    </v-list>
  </template>
  <v-alert
    v-else
    class="mb-0"
    density="comfortable"
    type="info"
    variant="tonal"
  >
    {{ fallbackMessage ?? 'No additional details provided for this quest yet.' }}
  </v-alert>
</template>

<style scoped>
.quest-details-item :deep(.v-list-item__subtitle) {
  white-space: pre-line;
}
</style>
