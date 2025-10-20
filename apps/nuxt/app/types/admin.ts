import type { PrivilegeKey } from 'shared'

export interface AdminRolePrivilege {
  key: PrivilegeKey
  label: string
  description: string | null
  assignedAt: string | Date
}

export interface AdminRole {
  id: string
  name: string
  description: string | null
  system: boolean
  createdAt: string | Date
  updatedAt: string | Date
  privileges: AdminRolePrivilege[]
  userCount: number
}

export interface AdminUserRole {
  id: string
  name: string
  description: string | null
  system: boolean
  assignedAt: string | Date
  assignedById: string | null
}

export interface AdminUser {
  id: string
  email: string
  name: string | null
  createdAt: string | Date
  updatedAt: string | Date
  roles: AdminUserRole[]
}

export interface AdminPrivilege {
  id: string
  key: PrivilegeKey
  label: string
  description: string | null
  createdAt: string | Date
  updatedAt: string | Date
}
