import { vi } from 'vitest'

export const questFindUniqueMock = vi.fn()
export const questUpdateMock = vi.fn()
export const taskUpdateManyMock = vi.fn()
export const taskFindUniqueMock = vi.fn()
export const taskUpdateMock = vi.fn()
export const transactionMock = vi.fn(async (operations: Array<Promise<any>>) => Promise.all(operations))

export class PrismaClientMock {
  quest = {
    findUnique: questFindUniqueMock,
    update: questUpdateMock,
  }

  task = {
    findUnique: taskFindUniqueMock,
    updateMany: taskUpdateManyMock,
    update: taskUpdateMock,
  }

  $transaction = transactionMock
}

export function resetPrismaMocks() {
  questFindUniqueMock.mockReset()
  questUpdateMock.mockReset()
  taskUpdateManyMock.mockReset()
  taskFindUniqueMock.mockReset()
  taskUpdateMock.mockReset()
  transactionMock.mockReset()
}
