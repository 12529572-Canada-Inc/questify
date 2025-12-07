<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
}>(), {
  title: 'Quests',
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
        <h2 class="text-h5 text-md-h4 font-weight-bold mb-0">
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

@media (max-width: 600px) {
  .quest-header__actions {
    justify-content: flex-start;
  }

  .quest-header__create {
    width: 100%;
  }
}
</style>
