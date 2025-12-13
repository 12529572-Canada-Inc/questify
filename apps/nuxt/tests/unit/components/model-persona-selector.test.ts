import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import type { PersonaWithModel } from 'shared/model-personas'
import { defaultAiModels } from 'shared/ai-models'
import ModelPersonaSelector from '../../../app/components/common/ModelPersonaSelector.vue'
import { mountWithBase } from '../support/mount-options'

vi.mock('~/composables/useModelPersonas', () => {
  const personas = ref<PersonaWithModel[]>([
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
  ])
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
const originalFetch = (globalThis as typeof globalThis & { $fetch?: unknown }).$fetch
const originalUseNuxtApp = (globalThis as typeof globalThis & { useNuxtApp?: unknown }).useNuxtApp

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
    Reflect.set(globalThis, '$fetch', vi.fn())
    Reflect.set(globalThis, 'useNuxtApp', vi.fn(() => ({ $fetch: (globalThis as typeof globalThis & { $fetch?: unknown }).$fetch })))
  })

  afterEach(() => {
    if (originalRuntimeConfig) {
      Reflect.set(globalThis, 'useRuntimeConfig', originalRuntimeConfig)
    }
    else {
      Reflect.deleteProperty(globalThis, 'useRuntimeConfig')
    }
    if (originalFetch) {
      Reflect.set(globalThis, '$fetch', originalFetch)
    }
    else {
      Reflect.deleteProperty(globalThis, '$fetch')
    }
    if (originalUseNuxtApp) {
      Reflect.set(globalThis, 'useNuxtApp', originalUseNuxtApp)
    }
    else {
      Reflect.deleteProperty(globalThis, 'useNuxtApp')
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
    expect(wrapper.text()).toContain('Selected persona')
  })

  it('sends telemetry when a persona is selected', async () => {
    const telemetryMock = vi.fn()
    Reflect.set(globalThis, '$fetch', telemetryMock)
    const wrapper = mountWithBase(ModelPersonaSelector, {
      props: { models: defaultAiModels },
      global: {
        stubs: {
          VTooltip: true,
        },
      },
    })

    await nextTick()
    const changeButton = wrapper.findAll('button').find(btn => btn.text().includes('Change persona'))
    expect(changeButton).toBeTruthy()
    await changeButton!.trigger('click')
    const dialogCard = wrapper.findAll('.persona-grid__item .persona-card')[0]
    await dialogCard.trigger('click')

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
