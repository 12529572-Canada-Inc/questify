/**
 * Canonical list of RBAC privileges and default roles shared across the stack.
 * These definitions are consumed by Prisma seeders, Nitro APIs, and Nuxt client
 * code to ensure consistent keys and labels for admin capabilities.
 */

export type PrivilegeKey =
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'user:role:assign'
  | 'role:read'
  | 'role:create'
  | 'role:update'
  | 'role:delete'
  | 'quest:admin'
  | 'system:settings:read'
  | 'system:settings:update'
  | 'audit:read'

export interface PrivilegeDefinition {
  key: PrivilegeKey
  label: string
  description: string
}

export interface RoleDefinition {
  name: string
  description: string
  system: boolean
  privileges: PrivilegeKey[]
}

export const PRIVILEGE_DEFINITIONS: readonly PrivilegeDefinition[] = [
  {
    key: 'user:read',
    label: 'Read Users',
    description: 'View any user profile and metadata.',
  },
  {
    key: 'user:create',
    label: 'Create Users',
    description: 'Invite or create new user accounts.',
  },
  {
    key: 'user:update',
    label: 'Update Users',
    description: 'Edit user profile details and status.',
  },
  {
    key: 'user:delete',
    label: 'Delete Users',
    description: 'Deactivate or remove user accounts.',
  },
  {
    key: 'user:role:assign',
    label: 'Manage User Roles',
    description: 'Assign or revoke roles for other users.',
  },
  {
    key: 'role:read',
    label: 'Read Roles',
    description: 'View defined roles and their permissions.',
  },
  {
    key: 'role:create',
    label: 'Create Roles',
    description: 'Create new roles within the system.',
  },
  {
    key: 'role:update',
    label: 'Update Roles',
    description: 'Edit role metadata and assigned privileges.',
  },
  {
    key: 'role:delete',
    label: 'Delete Roles',
    description: 'Delete roles that are no longer needed.',
  },
  {
    key: 'quest:admin',
    label: 'Administer Quests',
    description: 'Manage quests at the organization level (archive, reassign, etc.).',
  },
  {
    key: 'system:settings:read',
    label: 'Read System Settings',
    description: 'View global system configuration.',
  },
  {
    key: 'system:settings:update',
    label: 'Update System Settings',
    description: 'Modify global system configuration.',
  },
  {
    key: 'audit:read',
    label: 'Read Audit Log',
    description: 'View audit history of administrative actions.',
  },
] as const

export const SUPER_ADMIN_ROLE_NAME = 'SuperAdmin'
export const ADMIN_ROLE_NAME = 'Admin'
export const SUPPORT_ROLE_NAME = 'Support'

export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  {
    name: SUPER_ADMIN_ROLE_NAME,
    description: 'Full unrestricted access to every administrative action.',
    system: true,
    privileges: PRIVILEGE_DEFINITIONS.map(def => def.key),
  },
  {
    name: ADMIN_ROLE_NAME,
    description: 'Manage users, roles, and quests across the organization.',
    system: true,
    privileges: [
      'user:read',
      'user:create',
      'user:update',
      'user:role:assign',
      'role:read',
      'role:create',
      'role:update',
      'quest:admin',
      'system:settings:read',
      'audit:read',
    ],
  },
  {
    name: SUPPORT_ROLE_NAME,
    description: 'Support staff with read-level access and limited management.',
    system: false,
    privileges: [
      'user:read',
      'role:read',
      'quest:admin',
      'system:settings:read',
      'audit:read',
    ],
  },
] as const

export const DEFAULT_PRIVILEGE_KEYS = PRIVILEGE_DEFINITIONS.map(def => def.key)
