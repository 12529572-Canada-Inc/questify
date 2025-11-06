<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  showArchived: boolean
  canToggleArchived: boolean
}>(), {
  title: 'Quests',
})

const emit = defineEmits<{
  (event: 'update:showArchived', value: boolean): void
}>()

const showArchivedModel = computed({
  get: () => props.showArchived,
  set: (value: boolean) => emit('update:showArchived', value),
})
</script>

<template>
  <section class="quest-subheader mb-4">
    <v-row class="quest-subheader__row">
      <v-col
        cols="12"
        sm="6"
        class="quest-subheader__title"
      >
        <h2 class="text-h5 font-weight-bold text-white mb-0">
          {{ props.title }}
        </h2>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        class="quest-subheader__actions"
      >
        <v-btn
          color="primary"
          class="quest-subheader__create"
          :to="`/quests/new`"
        >
          Create Quest
        </v-btn>
      </v-col>
    </v-row>

    <v-row
      v-if="canToggleArchived"
      class="quest-subheader__filters"
    >
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="showArchivedModel"
          inset
          class="quest-subheader__archived-switch"
          color="secondary"
          label="Show Archived Quests"
        />
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.quest-subheader {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quest-subheader__row {
  align-items: center;
}

.quest-subheader__actions {
  display: flex;
  justify-content: flex-end;
}

.quest-subheader__create {
  min-width: 0;
}

.quest-subheader__filters {
  margin-bottom: 0;
}

.quest-subheader__archived-switch {
  color: white;
}

@media (max-width: 600px) {
  .quest-subheader__actions {
    justify-content: flex-start;
  }

  .quest-subheader__create {
    width: 100%;
  }
}
</style>
