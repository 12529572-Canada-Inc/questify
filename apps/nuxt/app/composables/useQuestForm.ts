import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

interface UseQuestFormOptions {
  onSuccess?: (questId: string) => void
}

export function useQuestForm(options: UseQuestFormOptions = {}) {
  const router = useRouter()

  const title = ref('')
  const goal = ref('')
  const context = ref('')
  const constraints = ref('')
  const showOptionalFields = ref(false)

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

  async function submit() {
    loading.value = true
    error.value = null

    try {
      const sanitizedTitle = title.value.trim()

      const res = await $fetch<CreateQuestResponse>('/api/quests', {
        method: 'POST',
        body: {
          title: sanitizedTitle,
          goal: goal.value,
          context: context.value,
          constraints: constraints.value,
        },
      })

      if (res.success && res.quest?.id) {
        options.onSuccess?.(res.quest.id)
        await router.push(`/quests/${res.quest.id}`)
        return
      }

      error.value = 'Failed to create quest'
    }
    catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      }
      else {
        error.value = 'Error creating quest'
      }
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
