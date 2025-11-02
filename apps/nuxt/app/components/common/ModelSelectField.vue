<script setup lang="ts">
import { computed } from 'vue'
import type { AiModelOption } from 'shared/ai-models'

const model = defineModel<string | null>({ default: null })

const props = defineProps<{ models: AiModelOption[] }>()

const selectedModel = computed(() => props.models.find(item => item.id === model.value) ?? props.models[0])

const items = computed(() => props.models.map(item => ({
  title: item.label,
  value: item.id,
  raw: item,
})))

function getModelByValue(value: string): AiModelOption | undefined {
  return props.models.find(m => m.id === value)
}
</script>

<template>
  <div class="model-select-field">
    <v-select
      v-model="model"
      :items="items"
      item-title="title"
      item-value="value"
      label="Choose AI model"
      hint="Select the assistant that best fits this request."
      persistent-hint
      variant="outlined"
      density="comfortable"
      v-bind="$attrs"
      :menu-props="{ maxHeight: 420 }"
    >
      <template #selection="{ item }">
        <span>{{ getModelByValue((item as any).value)?.label ?? (item as any).title }}</span>
        <span class="text-caption text-medium-emphasis ml-2">
          {{ getModelByValue((item as any).value)?.providerLabel }}
        </span>
      </template>
      <template #item="{ item, props: itemProps }">
        <v-list-item
          v-bind="itemProps"
          :title="undefined"
          :subtitle="undefined"
        >
          <v-list-item-title>{{ getModelByValue((item as any).value)?.label ?? (item as any).title }}</v-list-item-title>
          <v-list-item-subtitle>{{ getModelByValue((item as any).value)?.providerLabel }}</v-list-item-subtitle>
          <template #append>
            <v-tooltip
              :text="getModelByValue((item as any).value)?.description ?? 'No description'"
              location="left"
            >
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon="mdi-information-outline"
                  variant="text"
                  density="comfortable"
                />
              </template>
            </v-tooltip>
          </template>
        </v-list-item>
      </template>
    </v-select>

    <div
      v-if="selectedModel"
      class="model-select-field__meta"
    >
      <div class="model-select-field__tags">
        <v-chip
          v-for="tag in selectedModel.tags"
          :key="tag"
          size="small"
          label
          class="mr-1 mb-1"
        >
          {{ tag }}
        </v-chip>
      </div>
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ selectedModel.description }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.model-select-field {
  width: 100%;
}

.model-select-field__meta {
  margin-top: 8px;
}

.model-select-field__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}
</style>
