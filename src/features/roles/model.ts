export const permissionActions = [
  'Create',
  'View',
  'Update',
  'Delete',
  'Export',
  'Warn',
  'Ban',
] as const
export type PermissionAction = (typeof permissionActions)[number]

/** Portal modules and the actions each one supports. */
const modules: { id: string; name: string; actions: PermissionAction[] }[] = [
  { id: 'overview', name: 'Overview', actions: ['View', 'Export'] },
  { id: 'moderation', name: 'Moderation Queue', actions: ['View', 'Update', 'Export'] },
  { id: 'reports', name: 'Reports', actions: ['View', 'Export'] },
  { id: 'users', name: 'Users', actions: ['View', 'Update', 'Delete', 'Export', 'Warn', 'Ban'] },
  { id: 'audit', name: 'Audit Log', actions: ['View', 'Export'] },
  { id: 'hidden', name: 'Hidden Content', actions: ['View', 'Update'] },
  { id: 'roles', name: 'Roles & Permissions', actions: ['Create', 'View', 'Update', 'Delete'] },
  { id: 'staff', name: 'Staff Management', actions: ['Create', 'View', 'Update', 'Export'] },
  { id: 'settings', name: 'Settings', actions: ['View', 'Update'] },
]

export interface Permission {
  id: string
  category: string
  action: PermissionAction
}

/** Permission catalogue, in sidebar order. */
export const permissions: Permission[] = modules.flatMap((module) =>
  module.actions.map((action) => ({
    id: `${module.id}:${action.toLowerCase()}`,
    category: module.name,
    action,
  })),
)
export const allPermissionIds = permissions.map((permission) => permission.id)

export type RoleStatus = 'Active' | 'Inactive'
export interface Role {
  id: string
  name: string
  description: string
  /** Only loaded on the role's detail request; use `permissionCount` in lists. */
  permissionIds: string[]
  permissionCount: number
  /** Staff currently holding the role. */
  adminCount: number
  status: RoleStatus
  createdAt: string
  /** Creator's name; null for the seeded system role. */
  createdBy: string | null
  /** The built-in Super Admin role: its access is managed by the system, not from the portal. */
  builtIn: boolean
}

export type StaffStatus = 'Active' | 'Inactive' | 'Pending'
export interface StaffActivity {
  id: string
  text: string
  detail?: string
  createdAt: string
}
export interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  /** Every staff member holds at most one role. */
  roleId: string | null
  roleName: string | null
  status: StaffStatus
  createdAt: string
  lastLogin: string | null
  /** The root account can't be suspended or moved to another role. */
  isRoot: boolean
}

export interface RoleDraft {
  name: string
  description: string
  permissionIds: string[]
  staffIds: string[]
}
export const emptyDraft: RoleDraft = { name: '', description: '', permissionIds: [], staffIds: [] }

export const ROLE_DESCRIPTION_MAX = 500

export function staffName(staff: Pick<StaffMember, 'firstName' | 'lastName' | 'email'>) {
  return `${staff.firstName} ${staff.lastName}`.trim() || staff.email
}

export function validateRoleName(
  name: string,
  roles: Pick<Role, 'id' | 'name'>[],
  exceptId?: string,
) {
  const value = name.trim()
  if (!value) return 'Enter a role name.'
  if (value.length < 2) return 'Use at least 2 characters.'
  if (value.length > 100) return 'Use 100 characters or fewer.'
  if (roles.some((role) => role.id !== exceptId && role.name.toLowerCase() === value.toLowerCase()))
    return 'A role with this name already exists.'
  return ''
}

export function validateRoleDescription(description: string) {
  return description.trim().length < 2 ? 'Enter a description of at least 2 characters.' : ''
}

/** Optional phone number: digits with spaces, brackets, dashes and a leading +. */
export function phoneProblem(phone: string) {
  const value = phone.trim()
  if (!value) return ''
  const digits = value.replace(/\D/g, '').length
  if (!/^\+?[\d\s()-]+$/.test(value) || digits < 7 || digits > 15)
    return 'Enter a valid phone number.'
  return ''
}

/** e.g. “Nov 8, 2026”, matching the other Testify tables. */
export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

/** Local `YYYY-MM-DD` of an ISO timestamp, for comparing with date inputs. */
export function dayOf(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function inDateRange(value: string, from: string, to: string) {
  const day = dayOf(value)
  return (!from || day >= from) && (!to || day <= to)
}
