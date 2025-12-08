<script setup lang="ts">
import { computed, watch, useAttrs } from 'vue'
import type { AiModelOption } from 'shared/ai-models'

const model = defineModel<string | null>({ default: null })

const attrs = useAttrs()
const isExternallyDisabled = computed(() => {
  const disabled = attrs.disabled
  return disabled === '' || disabled === true || disabled === 'true'
})

const props = defineProps<{ models: AiModelOption[] }>()

const enabledModels = computed<AiModelOption[]>(() => props.models.filter(item => item.enabled !== false))
const hasEnabledModels = computed(() => enabledModels.value.length > 0)

const selectedModel = computed(() =>
  enabledModels.value.find(item => item.id === model.value) ?? enabledModels.value[0],
)

const items = computed(() => props.models.map(item => ({
  title: item.label,
  value: item.id,
  raw: item,
  disabled: item.enabled === false,
})))

function getModelByValue(value: string): AiModelOption | undefined {
  return props.models.find(m => m.id === value)
}

watch(
  () => [model.value, enabledModels.value] as [string | null, AiModelOption[]],
  ([current, enabled]) => {
    const list = Array.isArray(enabled) ? enabled : []
    if (!list.length) {
      model.value = ''
      return
    }
    const isCurrentEnabled = list.some(item => item?.id === current)
    if (!isCurrentEnabled) {
      model.value = list[0]?.id ?? ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="model-select-field">
    <v-select
      v-model="model"
      :items="items"
      item-title="title"
      item-value="value"
      item-disabled="disabled"
      label="Choose AI model"
      hint="Select the assistant that best fits this request."
      persistent-hint
      variant="outlined"
      density="comfortable"
      v-bind="$attrs"
      :menu-props="{ maxHeight: 420 }"
      :disabled="!hasEnabledModels || isExternallyDisabled"
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
            <v-chip
              v-if="getModelByValue((item as any).value)?.enabled === false"
              color="warning"
              size="x-small"
              variant="tonal"
              class="mr-2 text-uppercase font-weight-medium"
            >
              Unavailable
            </v-chip>
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

    <p
      v-if="!hasEnabledModels"
      class="text-caption text-error mt-1 mb-0"
    >
      No AI providers are configured for this environment. Update your API keys to enable model selection.
    </p>

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
