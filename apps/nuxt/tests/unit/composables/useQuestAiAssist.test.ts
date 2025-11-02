import { vi } from 'vitest'

const showSnackbarMock = vi.fn()

vi.mock('~/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: showSnackbarMock,
  }),
}))

import { computed, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { defaultAiModels } from 'shared/ai-models'
import { useQuestAiAssist } from '~/composables/useQuestAiAssist'
import { useUiStore } from '~/stores/ui'

const originalUseRuntimeConfig = (globalThis as typeof globalThis & { useRuntimeConfig?: () => unknown }).useRuntimeConfig
const originalFetch = (globalThis as typeof globalThis & { $fetch?: typeof $fetch }).$fetch
const fetchMock = vi.fn()

beforeEach(() => {
  setActivePinia(createPinia())
  showSnackbarMock.mockReset()
  fetchMock.mockReset()

  Reflect.set(globalThis, 'useRuntimeConfig', vi.fn(() => ({
    public: {
      features: { aiAssist: true },
      aiModels: defaultAiModels,
      aiModelDefaultId: 'gpt-4o-mini',
    },
  })))

  const aiCookie = useCookie<'on' | 'off'>('questify-ai-assist')
  aiCookie.value = 'on'

  Reflect.set(globalThis, '$fetch', fetchMock)
})

afterEach(() => {
  if (originalUseRuntimeConfig) {
    Reflect.set(globalThis, 'useRuntimeConfig', originalUseRuntimeConfig)
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
})

describe('useQuestAiAssist', () => {
  it('requests suggestions and stores responses', async () => {
    fetchMock.mockResolvedValue({
      success: true,
      field: 'title',
      modelId: 'gpt-4o-mini',
      suggestions: [{ text: 'Launch Day Rally', rationale: 'Short and energetic.' }],
    })

    const fields = {
      title: ref('Launch quest'),
      goal: ref('Ship MVP'),
      context: ref('A startup preparing for launch'),
      constraints: ref('Two week deadline'),
    }
    const modelType = ref('gpt-4o-mini')
    const modelOptions = computed(() => defaultAiModels)

    const composable = useQuestAiAssist({
      fields,
      modelType,
      modelOptions,
    })

    await composable.requestAssistance('title')

    expect(fetchMock).toHaveBeenCalledWith('/api/quests/assist', {
      method: 'POST',
      body: {
        field: 'title',
        title: 'Launch quest',
        goal: 'Ship MVP',
        context: 'A startup preparing for launch',
        constraints: 'Two week deadline',
        currentValue: 'Launch quest',
        modelType: 'gpt-4o-mini',
      },
    })
    expect(composable.dialogOpen.value).toBe(true)
    expect(composable.suggestions.value).toEqual([
      { text: 'Launch Day Rally', rationale: 'Short and energetic.' },
    ])
    expect(composable.error.value).toBeNull()
  })

  it('updates the field when a suggestion is applied', async () => {
    fetchMock.mockResolvedValue({
      success: true,
      field: 'title',
      modelId: 'gpt-4o-mini',
      suggestions: [{ text: 'Launch Day Rally' }],
    })

    const fields = {
      title: ref('Launch quest'),
      goal: ref('Ship MVP'),
      context: ref('A startup preparing for launch'),
      constraints: ref('Two week deadline'),
    }
    const modelType = ref('gpt-4o-mini')
    const modelOptions = computed(() => defaultAiModels)

    const composable = useQuestAiAssist({
      fields,
      modelType,
      modelOptions,
    })

    await composable.requestAssistance('title')
    composable.applySuggestion({ text: 'Launch Day Rally' })

    expect(fields.title.value).toBe('Launch Day Rally')
    expect(composable.dialogOpen.value).toBe(false)
    expect(showSnackbarMock).toHaveBeenCalled()
  })

  it('does not request suggestions when the feature is disabled', async () => {
    const fields = {
      title: ref('Launch quest'),
      goal: ref('Ship MVP'),
      context: ref('A startup preparing for launch'),
      constraints: ref('Two week deadline'),
    }
    const modelType = ref('gpt-4o-mini')
    const modelOptions = computed(() => defaultAiModels)

    const store = useUiStore()
    store.setAiAssistEnabled(false)

    const composable = useQuestAiAssist({
      fields,
      modelType,
      modelOptions,
    })

    await composable.requestAssistance('title')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(composable.dialogOpen.value).toBe(false)
  })

  it('surfaces errors from the API', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))

    const fields = {
      title: ref('Launch quest'),
      goal: ref('Ship MVP'),
      context: ref('A startup preparing for launch'),
      constraints: ref('Two week deadline'),
    }
    const modelType = ref('gpt-4o-mini')
    const modelOptions = computed(() => defaultAiModels)

    const composable = useQuestAiAssist({
      fields,
      modelType,
      modelOptions,
    })

    await composable.requestAssistance('title')

    expect(fetchMock).toHaveBeenCalled()
    expect(composable.error.value).toContain('network down')
    expect(composable.dialogOpen.value).toBe(true)
    expect(composable.suggestions.value).toEqual([])
  })
})
