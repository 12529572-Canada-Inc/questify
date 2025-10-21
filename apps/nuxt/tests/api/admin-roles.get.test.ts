import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/admin/roles/index.get'

const prismaMocks = vi.hoisted(() => ({
  roleFindMany: vi.fn(),
}))

const accessControlMocks = vi.hoisted(() => ({
  requirePrivilege: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    role = {
      findMany: prismaMocks.roleFindMany,
    }
  },
}))

vi.mock('../../server/utils/access-control', () => ({
  requirePrivilege: accessControlMocks.requirePrivilege,
}))

describe('API /api/admin/roles (GET)', () => {
  beforeEach(() => {
    accessControlMocks.requirePrivilege.mockResolvedValue({ id: 'actor-1', privileges: [] })
    prismaMocks.roleFindMany.mockResolvedValue([
      {
        id: 'role-1',
        name: 'Admin',
        description: 'Manage stuff',
        system: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        users: [{ userId: 'user-1' }],
        privileges: [
          {
            assignedAt: new Date('2025-01-01'),
            privilege: {
              id: 'priv-1',
              key: 'user:read',
              label: 'Read Users',
              description: 'View user profiles',
            },
          },
        ],
      },
    ])
  })

  it('returns serialized roles', async () => {
    const response = await handler({} as never)

    expect(accessControlMocks.requirePrivilege).toHaveBeenCalled()
    expect(prismaMocks.roleFindMany).toHaveBeenCalled()
    expect(response).toEqual([
      {
        id: 'role-1',
        name: 'Admin',
        description: 'Manage stuff',
        system: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        userCount: 1,
        privileges: [
          {
            key: 'user:read',
            label: 'Read Users',
            description: 'View user profiles',
            assignedAt: new Date('2025-01-01'),
          },
        ],
      },
    ])
  })
})
