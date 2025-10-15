// ✅ Minimal mock of PrismaClient used for route tests
export class PrismaClient {
  quest = {
    findMany: async () => [
      {
        id: 'mock-quest-1',
        title: 'Mock Quest',
        description: 'This is mocked quest data',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ],
  }

  // Optional: stub $disconnect so handlers calling it don’t crash
  async $disconnect() {
    console.log('[Mock Prisma] Disconnected.')
  }
}
