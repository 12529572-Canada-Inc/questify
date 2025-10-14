<script setup lang="ts">
const props = defineProps<{
  quest: Partial<Record<'goal' | 'context' | 'constraints', string | null>> | null
  fallbackMessage?: string
}>()

const { sections, hasDetails } = useQuestDetails(() => props.quest, {
  labels: {
    goal: 'Desired Outcome',
    context: 'Context',
    constraints: 'Constraints & Preferences',
  },
})
</script>

<template>
  <template v-if="hasDetails">
    <div
      v-for="section in sections"
      :key="section.key"
    >
      <h3 class="text-subtitle-1 font-weight-medium mb-1">
        {{ section.label }}
      </h3>
      <TextWithLinks
        class="mb-0"
        tag="p"
        :text="section.text"
      />
    </div>
  </template>
  <p
    v-else
    class="text-body-2 text-medium-emphasis mb-0"
  >
    {{ fallbackMessage ?? 'No additional details provided for this quest yet.' }}
  </p>
</template>
