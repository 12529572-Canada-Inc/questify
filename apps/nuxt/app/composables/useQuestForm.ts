import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { watchDebounced } from '@vueuse/core'
import { useSnackbar } from './useSnackbar'
import { extractStatusCode, resolveApiError } from '~/utils/error'
import { useQuestStore } from '~/stores/quest'
import { useUserStore } from '~/stores/user'
import { useAiModels } from './useAiModels'

interface UseQuestFormOptions {
  onSuccess?: (questId: string) => void
  initialIsPublic?: boolean
}

type QuestDraft = {
  title: string
  goal: string
  context: string
  constraints: string
  modelType: string
  isPublic: boolean
  images: string[]
}

const QUEST_DRAFT_STORAGE_KEY = 'quest-create-draft'

/**
 * Manages state, validation, and submission workflow for the quest creation form,
 * including AI model selection and optional field toggles.
 *
 * @param options.onSuccess - Optional callback invoked with the new quest id after creation.
 */
export function useQuestForm(options: UseQuestFormOptions = {}) {
  const router = useRouter()
  const route = useRoute()
  const { showSnackbar } = useSnackbar()
  const questStore = useQuestStore()
  const userStore = useUserStore()
  const { loaded } = storeToRefs(questStore)
  const { loggedIn } = storeToRefs(userStore)

  const title = ref('')
  const goal = ref('')
  const context = ref('')
  const constraints = ref('')
  const isPublic = ref(Boolean(options.initialIsPublic))
  const showOptionalFields = ref(false)
  const { models: aiModels, defaultModel } = useAiModels()
  const modelType = ref(defaultModel.value?.id ?? 'gpt-4o-mini')
  const images = ref<string[]>([])

  watch(defaultModel, (next) => {
    if (next && !modelType.value) {
      modelType.value = next.id
    }
  })

  const valid = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const rules = {
    title: [(v: string) => !!v || 'Title is required'],
  }

  const optionalValues = computed(() => [goal.value, context.value, constraints.value])

  watch(optionalValues, (values) => {
    if (values.some(value => typeof value === 'string' && value.trim().length > 0)) {
      showOptionalFields.value = true
    }
  }, { immediate: true })

  const isSubmitDisabled = computed(() => !valid.value || loading.value)

  function hasDraftContent(draft: QuestDraft) {
    return (
      [draft.title, draft.goal, draft.context, draft.constraints]
        .some(value => typeof value === 'string' && value.trim().length > 0)
        || draft.images.length > 0
    )
  }

  function persistDraftToStorage() {
    if (!import.meta.client) {
      return
    }

    const draft: QuestDraft = {
      title: title.value,
      goal: goal.value,
      context: context.value,
      constraints: constraints.value,
      modelType: modelType.value,
      isPublic: isPublic.value,
      images: images.value,
    }

    if (!hasDraftContent(draft)) {
      clearDraftStorage()
      return
    }

    try {
      sessionStorage.setItem(QUEST_DRAFT_STORAGE_KEY, JSON.stringify(draft))
    }
    catch (err) {
      if (import.meta.dev) {
        console.warn('Failed to persist quest draft to storage:', err)
      }
    }
  }

  function readDraftFromStorage(): QuestDraft | null {
    if (!import.meta.client) {
      return null
    }

    try {
      const raw = sessionStorage.getItem(QUEST_DRAFT_STORAGE_KEY)
      if (!raw) {
        return null
      }

      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') {
        return null
      }

      const draft = parsed as Partial<QuestDraft>
      return {
        title: draft.title ?? '',
        goal: draft.goal ?? '',
        context: draft.context ?? '',
        constraints: draft.constraints ?? '',
        modelType: draft.modelType ?? '',
        isPublic: Boolean(draft.isPublic),
        images: Array.isArray(draft.images) ? draft.images.filter((img): img is string => typeof img === 'string') : [],
      }
    }
    catch (err) {
      if (import.meta.dev) {
        console.warn('Failed to read quest draft from storage:', err)
      }
      return null
    }
  }

  function clearDraftStorage() {
    if (!import.meta.client) {
      return
    }

    try {
      sessionStorage.removeItem(QUEST_DRAFT_STORAGE_KEY)
    }
    catch (err) {
      if (import.meta.dev) {
        console.warn('Failed to clear quest draft storage:', err)
      }
    }
  }

  function applyDraft(draft: QuestDraft) {
    title.value = draft.title
    goal.value = draft.goal
    context.value = draft.context
    constraints.value = draft.constraints
    if (draft.modelType) {
      modelType.value = draft.modelType
    }
    isPublic.value = draft.isPublic
    images.value = draft.images
  }

  function buildAuthRedirectPath() {
    const resolved = router.resolve({
      path: route.path,
      query: { ...route.query },
    })

    return resolved.href || resolved.fullPath || route.fullPath
  }

  async function handleAuthRedirect() {
    persistDraftToStorage()
    showSnackbar('Please log in to create your quest. We saved your draft.', { variant: 'info' })

    await router.push({
      path: '/auth/login',
      query: { redirectTo: buildAuthRedirectPath() },
    })
  }

  onMounted(() => {
    const draft = readDraftFromStorage()
    if (!draft || !hasDraftContent(draft)) {
      return
    }

    applyDraft(draft)
  })

  watchDebounced(
    () => ({
      title: title.value,
      goal: goal.value,
      context: context.value,
      constraints: constraints.value,
      modelType: modelType.value,
      isPublic: isPublic.value,
      images: images.value,
    }),
    () => {
      persistDraftToStorage()
    },
    { debounce: 300, maxWait: 800 },
  )

  async function submit() {
    loading.value = true
    error.value = null

    try {
      if (!loggedIn.value) {
        await userStore.fetchSession().catch(() => null)
      }

      if (!loggedIn.value) {
        await handleAuthRedirect()
        return
      }

      const sanitizedTitle = title.value.trim()

      const res = await $fetch<CreateQuestResponse>('/api/quests', {
        method: 'POST',
        body: {
          title: sanitizedTitle,
          goal: goal.value,
          context: context.value,
          constraints: constraints.value,
          modelType: modelType.value,
          isPublic: isPublic.value,
          images: images.value,
        },
      })

      if (res.success && res.quest?.id) {
        options.onSuccess?.(res.quest.id)
        showSnackbar('Quest created successfully.', { variant: 'success' })
        clearDraftStorage()
        if (loaded.value) {
          await questStore.fetchQuests({ force: true }).catch(() => null)
        }
        await router.push(`/quests/${res.quest.id}`)
        return
      }

      const message = 'Failed to create quest'
      error.value = message
      showSnackbar(message, { variant: 'error' })
    }
    catch (e: unknown) {
      const statusCode = extractStatusCode(e)

      if (statusCode === 401) {
        await handleAuthRedirect()
        return
      }

      const message = resolveApiError(e, 'Error creating quest')
      error.value = message
      showSnackbar(message, { variant: 'error' })
    }
    finally {
      loading.value = false
    }
  }

  function toggleOptionalFields() {
    showOptionalFields.value = !showOptionalFields.value
  }

  return {
    title,
    goal,
    context,
    constraints,
    modelType,
    modelOptions: aiModels,
    isPublic,
    images,
    showOptionalFields,
    valid,
    loading,
    error,
    rules,
    isSubmitDisabled,
    submit,
    toggleOptionalFields,
  }
}
