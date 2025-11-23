<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  actionLabel?: string
  actionTo?: string
  actionIcon?: string
  actionColor?: string
}>(), {
  title: 'Tasks',
  actionIcon: 'mdi-arrow-right',
  actionColor: 'primary',
})
</script>

<template>
  <section class="task-header mb-4">
    <v-row class="task-header__row">
      <v-col
        cols="12"
        md="8"
      >
        <h2 class="text-h5 text-md-h4 font-weight-bold mb-2 text-white">
          {{ props.title }}
        </h2>
      </v-col>
      <v-col
        v-if="props.actionLabel && props.actionTo"
        cols="12"
        md="4"
        class="task-header__action"
      >
        <v-btn
          :color="props.actionColor"
          :to="props.actionTo"
          block
        >
          <v-icon
            v-if="props.actionIcon"
            :icon="props.actionIcon"
            start
          />
          {{ props.actionLabel }}
        </v-btn>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.task-header__row {
  align-items: center;
}

.task-header__action {
  display: flex;
  align-items: flex-end;
}

@media (max-width: 960px) {
  .task-header__action {
    margin-top: 12px;
  }
}
</style>
