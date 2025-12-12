import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import type { PersonaWithModel } from 'shared/model-personas'
import { defaultAiModels } from 'shared/ai-models'
import ModelPersonaSelector from '../../../app/components/common/ModelPersonaSelector.vue'
import { mountWithBase } from '../support/mount-options'

const personasFixture: PersonaWithModel[] = [
  {
    key: 'swift-scout',
    name: 'Swift Scout',
    tagline: 'Fast drafts',
    bestFor: ['Brainstorm', 'Summaries'],
    speed: 'fastest',
    cost: 'low',
    contextLength: 'short',
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    modelLabel: 'GPT-4o mini',
    providerLabel: 'OpenAI',
    tags: ['fast'],
    recommended: true,
    recommendedReason: 'Fast and low-cost for drafts and quick replies.',
    enabled: true,
  },
  {
    key: 'strategist',
    name: 'Strategist',
    tagline: 'Reasoning heavy',
    bestFor: ['Plans'],
    speed: 'fast',
    cost: 'high',
    contextLength: 'long',
    provider: 'openai',
    modelId: 'gpt-4.1',
    modelLabel: 'GPT-4.1',
    providerLabel: 'OpenAI',
    tags: ['reasoning'],
    enabled: true,
  },
]

vi.mock('~/composables/useModelPersonas', () => {
  const personas = ref<PersonaWithModel[]>(personasFixture)
  const recommendedKey = ref('swift-scout')
  return {
    useModelPersonas: () => ({
      personas,
      recommendedKey,
      featureEnabled: true,
      variant: 'pilot',
      loading: ref(false),
      error: ref(null),
      refresh: vi.fn(),
    }),
  }
})

const originalRuntimeConfig = (globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown }).useRuntimeConfig

describe('ModelPersonaSelector', () => {
  beforeEach(() => {
    Reflect.set(globalThis, 'useRuntimeConfig', vi.fn(() => ({
      public: {
        appEnv: 'test',
        aiModels: defaultAiModels,
        features: {
          modelPersonas: true,
          modelPersonasVariant: 'pilot',
        },
      },
    })))
  })

  afterEach(() => {
    if (originalRuntimeConfig) {
      Reflect.set(globalThis, 'useRuntimeConfig', originalRuntimeConfig)
    }
    else {
      Reflect.deleteProperty(globalThis, 'useRuntimeConfig')
    }
  })

  it('selects the recommended persona by default', async () => {
    const wrapper = mountWithBase(ModelPersonaSelector, {
      props: { models: defaultAiModels },
      global: {
        stubs: {
          VTooltip: true,
        },
        mocks: {
          $fetch: vi.fn(),
        },
      },
    })

    await nextTick()

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted?.[0]?.[0]).toBe('gpt-4o-mini')
    expect(wrapper.find('.persona-card--selected').exists()).toBe(true)
  })

  it('sends telemetry when a persona is selected', async () => {
    const telemetryMock = vi.fn()
    const wrapper = mountWithBase(ModelPersonaSelector, {
      props: { models: defaultAiModels },
      global: {
        stubs: {
          VTooltip: true,
        },
        mocks: {
          $fetch: telemetryMock,
        },
      },
    })

    await nextTick()
    await wrapper.find('.persona-card').trigger('click')

    expect(telemetryMock).toHaveBeenCalledWith(
      '/api/models/personas/event',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          event: 'model_persona_selected',
          attributes: expect.objectContaining({ personaKey: 'swift-scout' }),
        }),
      }),
    )
  })
})
