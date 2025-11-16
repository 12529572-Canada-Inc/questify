<!-- TODO: Implement or remove this component -->
<script setup lang="ts">
type CompactAction = {
  label: string
  icon: string
  handler: () => void
  disabled?: boolean
  color?: string
}

const props = defineProps<{
  highlighted: boolean
  actions: CompactAction[]
  taskId?: string
}>()

const menuOpen = ref(false)

function handleAction(action: CompactAction) {
  if (action.disabled) return
  action.handler()
  menuOpen.value = false
}
</script>

<template>
  <v-menu
    v-model="menuOpen"
    location="bottom"
    :close-on-content-click="false"
    offset="4"
  >
    <template #activator="{ props: menuProps }">
      <v-list-item
        v-bind="menuProps"
        :data-task-id="taskId"
        :class="[
          'py-3',
          'quest-task-compact',
          { 'quest-task-compact--highlighted': highlighted },
        ]"
        role="button"
        rounded="lg"
      >
        <div class="quest-task-compact__body">
          <div class="quest-task-compact__title">
            <slot name="title" />
          </div>
          <div class="quest-task-compact__subtitle">
            <slot name="subtitle" />
          </div>
        </div>
        <v-icon
          icon="mdi-dots-vertical"
          class="quest-task-compact__icon"
        />
      </v-list-item>
    </template>

    <v-list
      density="comfortable"
      class="quest-task-compact__menu"
    >
      <v-list-item
        v-for="action in props.actions"
        :key="action.label"
        :disabled="action.disabled"
        @click="handleAction(action)"
      >
        <template #prepend>
          <v-icon
            :icon="action.icon"
            :color="action.color"
          />
        </template>
        <v-list-item-title>{{ action.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped>
.quest-task-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.quest-task-compact__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
}

.quest-task-compact__title :deep(*) {
  font-weight: 600;
}

.quest-task-compact__subtitle {
  display: contents;
}

.quest-task-compact__icon {
  opacity: 0.6;
  flex: 0 0 auto;
}

.quest-task-compact--highlighted {
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-left: 3px solid rgba(var(--v-theme-primary), 0.65);
}

.quest-task-compact__menu {
  min-width: 220px;
}
</style>
