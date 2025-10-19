import { computed, ref } from 'vue'
import { vi } from 'vitest'

const clipboardCopy = vi.fn().mockResolvedValue(undefined)

vi.mock('@vueuse/core', () => ({
  useClipboard: vi.fn(() => ({
    copy: clipboardCopy,
    copied: ref(false),
    isSupported: ref(true),
  })),
  useVModel: <T extends Record<string, unknown>>(props: T, name: keyof T, emit?: (event: string, value: unknown) => void) => computed({
    get: () => props[name],
    set: value => emit?.(`update:${String(name)}`, value),
  }),
  useBreakpoints: vi.fn(() => ({
    smallerOrEqual: vi.fn(() => ref(false)),
  })),
  useWindowSize: vi.fn(() => ({
    width: ref(1024),
    height: ref(768),
  })),
  breakpointsVuetifyV3: {},
}))
