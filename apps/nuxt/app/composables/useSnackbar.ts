import { computed } from 'vue'

export type SnackbarVariant = 'success' | 'error' | 'info' | 'warning'

export interface ShowSnackbarOptions {
  variant?: SnackbarVariant
  timeout?: number
  color?: string
  icon?: string | null
  multiLine?: boolean
}

interface SnackbarMessage {
  id: number
  message: string
  variant: SnackbarVariant
  color: string
  icon: string | null
  timeout: number
  multiLine: boolean
}

interface SnackbarState {
  queue: SnackbarMessage[]
  current: SnackbarMessage | null
  visible: boolean
}

const DEFAULT_TIMEOUT = 4000

const VARIANT_META: Record<SnackbarVariant, { color: string, icon: string | null }> = {
  success: {
    color: 'success',
    icon: 'mdi-check-circle',
  },
  error: {
    color: 'error',
    icon: 'mdi-alert-circle',
  },
  info: {
    color: 'primary',
    icon: 'mdi-information',
  },
  warning: {
    color: 'warning',
    icon: 'mdi-alert',
  },
}

function createMessage(message: string, options: ShowSnackbarOptions = {}): SnackbarMessage {
  const variant = options.variant ?? 'info'
  const meta = VARIANT_META[variant]

  return {
    id: Date.now() + Math.floor(Math.random() * 10000),
    message,
    variant,
    color: options.color ?? meta.color,
    icon: options.icon === undefined ? meta.icon : options.icon,
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
    multiLine: options.multiLine ?? false,
  }
}

function tryDisplayNext(state: SnackbarState) {
  if (state.visible || state.current || state.queue.length === 0) {
    return
  }

  const next = state.queue.shift()

  if (!next) {
    return
  }

  state.current = next
  state.visible = true
}

export function useSnackbar() {
  const state = useState<SnackbarState>('snackbar-state', () => ({
    queue: [],
    current: null,
    visible: false,
  }))

  function showSnackbar(message: string, options: ShowSnackbarOptions = {}) {
    const trimmed = message.trim()

    if (!trimmed) {
      return
    }

    state.value.queue.push(createMessage(trimmed, options))
    tryDisplayNext(state.value)
  }

  function setVisible(value: boolean) {
    if (state.value.visible === value) {
      return
    }

    state.value.visible = value

    if (!value && state.value.current) {
      const currentId = state.value.current.id

      setTimeout(() => {
        if (state.value.current && state.value.current.id === currentId) {
          state.value.current = null
          tryDisplayNext(state.value)
        }
      }, 200)
    }
  }

  function dismissCurrent() {
    if (!state.value.visible) {
      return
    }
    setVisible(false)
  }

  function clearQueue() {
    state.value.queue = []
    state.value.current = null
    state.value.visible = false
  }

  const current = computed(() => state.value.current)
  const visible = computed(() => state.value.visible)

  return {
    current,
    visible,
    showSnackbar,
    setVisible,
    dismissCurrent,
    clearQueue,
  }
}
