<script setup lang="ts">
import { useQuestDetails } from '~/composables/useQuestDetails'

const props = defineProps<{
  quest: Partial<Record<'goal' | 'context' | 'constraints', string | null>>
  emptyMessage?: string
}>()

const { sections, hasDetails } = useQuestDetails(props.quest)
</script>

<template>
  <TextWithLinks
    v-if="!hasDetails"
    class="mb-0"
    tag="p"
    :text="emptyMessage ?? 'No additional details provided.'"
  />
  <template v-else>
    <p
      v-for="section in sections"
      :key="section.key"
      class="text-body-2 text-medium-emphasis mb-0"
    >
      <strong>{{ section.label }}:</strong>
      <TextWithLinks
        tag="span"
        :text="section.text"
      />
    </p>
  </template>
</template>
