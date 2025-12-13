<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AiModelOption } from 'shared/ai-models'
import type { PersonaWithModel } from 'shared/model-personas'
import { useModelPersonas } from '~/composables/useModelPersonas'
import ModelSelectField from './ModelSelectField.vue'

const modelValue = defineModel<string | null>({ default: null })

const props = withDefaults(defineProps<{
  models: AiModelOption[]
  surface?: string
  disabled?: boolean
}>(), {
  surface: 'quest-create',
  disabled: false,
})

const runtimeConfig = useRuntimeConfig()
const environment = runtimeConfig.public.appEnv || 'local'
const nuxtApp = (globalThis as typeof globalThis & { useNuxtApp?: () => { $fetch?: typeof $fetch } }).useNuxtApp?.()

const {
  personas,
  recommendedKey,
  featureEnabled,
  variant,
  loading,
  error,
} = useModelPersonas()

const showPersonaUi = computed(() => featureEnabled && variant !== 'control')
const viewedKeys = ref(new Set<string>())
const recommendedLogged = ref(false)

const selectedPersona = computed<PersonaWithModel | null>(() => {
  return personas.value.find(persona => persona.modelId === modelValue.value)
    ?? personas.value.find(persona => persona.key === recommendedKey.value)
    ?? personas.value.find(persona => persona.enabled !== false)
    ?? personas.value[0]
    ?? null
})

watch(
  personas,
  (next) => {
    if (!showPersonaUi.value) return
    for (const persona of next) {
      if (viewedKeys.value.has(persona.key)) continue
      trackEvent('model_persona_viewed', persona)
      viewedKeys.value.add(persona.key)
    }
  },
  { immediate: true },
)

watch(
  () => recommendedKey.value,
  (key) => {
    if (!showPersonaUi.value || recommendedLogged.value) return
    const persona = personas.value.find(item => item.key === key)
    if (persona) {
      trackEvent('model_persona_recommended_shown', persona)
      recommendedLogged.value = true
    }
  },
)

watch(
  () => [personas.value, recommendedKey.value] as const,
  ([list, recommended]) => {
    if (!showPersonaUi.value) return
    if (modelValue.value && list.some(persona => persona.modelId === modelValue.value)) return
    const fallback = list.find(persona => persona.key === recommended && persona.enabled !== false)
      ?? list.find(persona => persona.enabled !== false)
      ?? list[0]
    if (fallback) {
      modelValue.value = fallback.modelId
    }
  },
  { immediate: true },
)

function isSelected(persona: PersonaWithModel) {
  return persona.modelId === modelValue.value
}

function formatSpeed(speed: PersonaWithModel['speed']) {
  if (speed === 'fastest') return 'Speed: Fastest'
  if (speed === 'faster') return 'Speed: Faster'
  return 'Speed: Fast'
}

function formatCost(cost: PersonaWithModel['cost']) {
  if (cost === 'low') return 'Cost: Low'
  if (cost === 'high') return 'Cost: High'
  return 'Cost: Medium'
}

function formatContext(context: PersonaWithModel['contextLength']) {
  if (context === 'long') return 'Context: Long'
  if (context === 'short') return 'Context: Short'
  return 'Context: Medium'
}

async function trackEvent(eventName: string, persona: PersonaWithModel | null) {
  if (!showPersonaUi.value || !persona) return
  const fetcher = nuxtApp?.$fetch ?? (globalThis as typeof globalThis & { $fetch?: typeof $fetch }).$fetch
  if (!fetcher) return

  const result = fetcher('/api/models/personas/event', {
    method: 'POST',
    body: {
      event: eventName,
      attributes: {
        personaKey: persona.key,
        provider: persona.provider,
        modelId: persona.modelId,
        surface: props.surface,
        environment,
      },
    },
  })

  await Promise.resolve(result).catch(() => null)
}

async function handleHover(persona: PersonaWithModel) {
  if (persona.enabled === false || props.disabled) return
  await trackEvent('model_persona_hovered', persona)
}

async function selectPersona(persona: PersonaWithModel) {
  if (persona.enabled === false || props.disabled) return
  modelValue.value = persona.modelId
  await trackEvent('model_persona_selected', persona)
  if (persona.key === recommendedKey.value) {
    await trackEvent('model_persona_recommended_accepted', persona)
  }
}
</script>

<template>
  <div class="model-persona-selector">
    <ModelSelectField
      v-if="!showPersonaUi"
      v-model="modelValue"
      :models="models"
      :disabled="disabled"
    />

    <div v-else>
      <div class="selector-header mb-3">
        <div>
          <p class="mb-1 text-subtitle-1 text-high-emphasis">
            Choose an AI persona
          </p>
          <p class="mb-0 text-body-2 text-medium-emphasis">
            Each persona wraps a specific provider and model with clear strengths.
          </p>
        </div>
        <v-chip
          v-if="variant && variant !== 'control'"
          size="x-small"
          color="secondary"
          variant="tonal"
        >
          Experiment: {{ variant }}
        </v-chip>
      </div>

      <v-alert
        v-if="error"
        type="warning"
        variant="tonal"
        density="comfortable"
        class="mb-3"
      >
        We could not load persona metadata. Falling back to available models.
      </v-alert>

      <div class="persona-grid">
        <div
          v-for="persona in personas"
          :key="persona.key"
          class="persona-grid__item"
        >
          <v-card
            :elevation="isSelected(persona) ? 6 : 1"
            :class="[
              'persona-card',
              { 'persona-card--selected': isSelected(persona), 'persona-card--disabled': persona.enabled === false || disabled },
            ]"
            variant="outlined"
            @click="selectPersona(persona)"
            @mouseenter="handleHover(persona)"
          >
            <div class="persona-card__header">
              <div class="persona-card__identity">
                <v-avatar
                  size="44"
                  color="primary"
                  variant="tonal"
                >
                  <span class="text-subtitle-1 font-weight-medium">{{ persona.name.charAt(0) }}</span>
                </v-avatar>
                <div class="persona-card__title">
                  <p class="mb-0 text-subtitle-1 text-high-emphasis">
                    {{ persona.name }}
                  </p>
                  <p class="mb-0 text-caption text-medium-emphasis">
                    {{ persona.tagline || `${persona.providerLabel ?? persona.provider} • ${persona.modelLabel ?? persona.modelId}` }}
                  </p>
                </div>
              </div>
              <div class="persona-card__chips">
                <v-chip
                  v-if="persona.key === recommendedKey"
                  size="x-small"
                  color="primary"
                  variant="flat"
                  class="text-uppercase font-weight-medium"
                >
                  Recommended
                </v-chip>
                <v-chip
                  v-if="persona.enabled === false || disabled"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  class="text-uppercase font-weight-medium"
                >
                  Unavailable
                </v-chip>
              </div>
            </div>

            <div class="persona-card__body">
              <div class="persona-card__badges">
                <v-chip
                  size="x-small"
                  variant="tonal"
                  color="primary"
                >
                  {{ formatSpeed(persona.speed) }}
                </v-chip>
                <v-chip
                  size="x-small"
                  variant="tonal"
                  color="secondary"
                >
                  {{ formatCost(persona.cost) }}
                </v-chip>
                <v-chip
                  size="x-small"
                  variant="tonal"
                  color="info"
                >
                  {{ formatContext(persona.contextLength) }}
                </v-chip>
              </div>

              <ul
                v-if="persona.bestFor.length"
                class="persona-card__bestfor"
              >
                <li
                  v-for="item in persona.bestFor"
                  :key="item"
                >
                  {{ item }}
                </li>
              </ul>

              <div
                v-else
                class="persona-card__fallback"
              >
                <v-chip
                  size="small"
                  label
                  variant="outlined"
                >
                  {{ persona.providerLabel ?? persona.provider }} • {{ persona.modelLabel ?? persona.modelId }}
                </v-chip>
                <p class="mb-0 text-body-2 text-medium-emphasis">
                  Generic provider selection. Detailed persona metadata not available.
                </p>
              </div>
            </div>

            <div class="persona-card__footer">
              <div class="persona-card__meta">
                <span class="text-caption text-medium-emphasis">
                  {{ persona.providerLabel ?? persona.provider }} • {{ persona.modelLabel ?? persona.modelId }}
                </span>
                <v-tooltip
                  text="Provider and model details"
                  location="top"
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      icon="mdi-information-outline"
                      variant="text"
                      density="comfortable"
                      size="small"
                    />
                  </template>
                  <div class="text-body-2">
                    <p class="mb-1">
                      Provider: {{ persona.providerLabel ?? persona.provider }}
                    </p>
                    <p class="mb-1">
                      Model ID: {{ persona.modelId }}
                    </p>
                    <p v-if="persona.infoUrl" class="mb-0">
                      <a
                        :href="persona.infoUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Release notes
                      </a>
                    </p>
                  </div>
                </v-tooltip>
              </div>

              <p
                v-if="persona.key === recommendedKey && persona.recommendedReason"
                class="text-caption text-medium-emphasis mb-0"
              >
                Why recommended: {{ persona.recommendedReason }}
              </p>

              <p
                v-if="persona.disabledReason"
                class="text-caption text-error mb-0"
              >
                {{ persona.disabledReason }}
              </p>
            </div>
          </v-card>
        </div>
      </div>

      <div
        v-if="loading"
        class="text-caption text-medium-emphasis mt-1"
      >
        Loading personas...
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-persona-selector {
  width: 100%;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.persona-card {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 150ms ease, border-color 150ms ease;
  cursor: pointer;
}

.persona-card--selected {
  border-color: rgb(var(--v-theme-primary));
}

.persona-card--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.persona-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 0;
}

.persona-card__identity {
  display: flex;
  gap: 10px;
}

.persona-card__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.persona-card__chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.persona-card__body {
  padding: 0 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.persona-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.persona-card__bestfor {
  padding-left: 18px;
  margin: 0;
  display: grid;
  gap: 4px;
}

.persona-card__fallback {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.persona-card__footer {
  border-top: 1px solid rgba(var(--v-border-color), 0.8);
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.persona-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

@media (max-width: 600px) {
  .persona-card__meta {
    flex-direction: column;
    align-items: flex-start;
  }
}

.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 12px;
}

.persona-grid__item {
  min-width: 0;
}
</style>
