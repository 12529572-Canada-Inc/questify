import { vi } from 'vitest'

vi.mock('qrcode', () => ({
  toDataURL: vi.fn(async (value: string) => `data:image/png;base64,${btoa(value)}`),
}))
