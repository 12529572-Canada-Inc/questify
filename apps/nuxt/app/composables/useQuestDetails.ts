import { computed, unref, type MaybeRef } from 'vue'

type QuestDetailKey = 'goal' | 'context' | 'constraints'

type QuestDetailSource = Partial<Record<QuestDetailKey, string | null | undefined>> | null | undefined

export interface QuestDetailSection {
  key: QuestDetailKey
  label: string
  text: string
}

interface QuestDetailOptions {
  labels?: Partial<Record<QuestDetailKey, string>>
}

export function useQuestDetails(
  quest: MaybeRef<QuestDetailSource>,
  options: QuestDetailOptions = {},
) {
  const labels: Record<QuestDetailKey, string> = {
    goal: 'Goal',
    context: 'Context',
    constraints: 'Constraints',
    ...options.labels,
  }

  const sections = computed<QuestDetailSection[]>(() => {
    const value = unref(quest)

    if (!value) {
      return []
    }

    return (['goal', 'context', 'constraints'] as QuestDetailKey[])
      .map(key => {
        const text = value[key]?.trim() ?? ''
        return {
          key,
          label: labels[key],
          text,
        }
      })
      .filter(section => section.text.length > 0)
  })

  const hasDetails = computed(() => sections.value.length > 0)

  return {
    sections,
    hasDetails,
  }
}
