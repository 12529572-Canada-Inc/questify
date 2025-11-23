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
  <section class="quest-header mb-4">
    <v-row class="quest-header__row">
      <v-col
        cols="12"
        sm="6"
        class="quest-header__title"
      >
        <h2 class="text-h5 text-md-h4 font-weight-bold text-white mb-0">
          {{ props.title }}
        </h2>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        class="quest-header__actions"
      >
        <v-btn
          color="primary"
          class="quest-header__create"
          :to="`/quests/new`"
        >
          Create Quest
        </v-btn>
      </v-col>
    </v-row>

    <v-row
      v-if="canToggleArchived"
      class="quest-header__filters"
    >
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="showArchivedModel"
          inset
          class="quest-header__archived-switch"
          color="secondary"
          label="Show Archived Quests"
        />
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.quest-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quest-header__row {
  align-items: center;
}

.quest-header__actions {
  display: flex;
  justify-content: flex-end;
}

.quest-header__create {
  min-width: 0;
}

.quest-header__filters {
  margin-bottom: 0;
}

.quest-header__archived-switch {
  color: white;
}

@media (max-width: 600px) {
  .quest-header__actions {
    justify-content: flex-start;
  }

  .quest-header__create {
    width: 100%;
  }
}
</style>
