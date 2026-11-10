import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Panel } from '@/components/testify/panel'
import { buttonClass } from '@/components/testify/button-class'
import { labelClass, tabClass } from '@/components/testify/form-styles'
import { SelectField } from '@/components/testify/select-field'
import { SheetBody, SheetDialog, SheetFooter } from '@/components/testify/sheet-dialog'
import { errorMessage } from '@/lib/api/base-api'
import { cn } from '@/lib/utils'
import { usePermission } from '@/features/auth/use-permission'
import { useGetRoleQuery, useReassignRoleMutation, useUpdateRoleMutation } from './access-api'
import { staffName, type Role, type StaffMember } from './model'
import { useIsOwnAccount, useRoles } from './use-access'
import { AdminPicker } from './components/admin-picker'
import { EditRoleDialog } from './components/edit-role-dialog'
import { PermissionTable } from './components/permission-table'
import { RoleSummary } from './components/role-summary'

export function RoleDetailPage() {
  const { roleId = '' } = useParams()
  const { roles } = useRoles()
  const { data: role, isLoading, isError, error, refetch } = useGetRoleQuery(roleId)
  const canUpdate = usePermission('roles:update')
  const [updateRole, { isLoading: saving }] = useUpdateRoleMutation()
  const [editing, setEditing] = useState(false)
  const [permissions, setPermissions] = useState<string[] | null>(null)
  const [moving, setMoving] = useState<StaffMember | null>(null)

  if (isLoading)
    return (
      <AdminLayout title="Role Details" backTo="/roles">
        <Panel className="px-6 py-[70px] text-center">
          <p role="status" className="text-[14px] text-tf-muted">
            Loading role…
          </p>
        </Panel>
      </AdminLayout>
    )

  if (!role) {
    const missing = isError && (error as { status?: unknown }).status === 404
    return (
      <AdminLayout title="Role Details" backTo="/roles">
        <Panel className="flex flex-col items-center gap-4 px-6 py-[70px] text-center">
          <h2 className="text-[20px] font-semibold">
            {missing ? 'Role not found' : 'We couldn’t load this role'}
          </h2>
          <p className="text-[14px] text-tf-muted">
            {missing ? 'This role may have been deleted.' : errorMessage(error)}
          </p>
          {missing ? (
            <Link to="/roles" className={cn(buttonClass.primary, 'h-11 text-[14px]')}>
              Back to Roles
            </Link>
          ) : (
            <button
              type="button"
              className={cn(buttonClass.primary, 'h-11 text-[14px]')}
              onClick={() => void refetch()}
            >
              Try again
            </button>
          )}
        </Panel>
      </AdminLayout>
    )
  }

  async function savePermissions() {
    if (!role || !permissions?.length) return
    try {
      await updateRole({ ...role, permissionIds: permissions }).unwrap()
      setPermissions(null)
      toast.success('Permissions updated')
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }

  const editable = canUpdate && !role.builtIn

  return (
    <AdminLayout title="Role Details" backTo="/roles">
      <RoleSummary role={role} onEdit={canUpdate ? () => setEditing(true) : undefined} />
      <TabsPrimitive.Root defaultValue="admins" className="mt-6">
        <TabsPrimitive.List
          aria-label="Role details"
          className="flex gap-[56px] overflow-x-auto border-b border-[#2b2e33]"
        >
          <TabsPrimitive.Trigger value="admins" className={cn(tabClass, 'px-2')}>
            Admins <span>({role.adminCount})</span>
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="permissions" className={cn(tabClass, 'px-2')}>
            Permissions <span>({role.permissionCount})</span>
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>
        <Panel className="mt-6 p-4 sm:p-6">
          <TabsPrimitive.Content value="admins">
            <AdminPicker
              assignedOnly
              currentRole={{ id: role.id, name: role.name }}
              onChangeRole={canUpdate ? setMoving : undefined}
            />
          </TabsPrimitive.Content>
          <TabsPrimitive.Content value="permissions">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
              <p className="flex items-center gap-2 text-[14px] text-tf-muted">
                {role.builtIn && <Lock className="size-4 text-tf-gold" aria-hidden />}
                {role.builtIn
                  ? 'Built-in role: its access is managed by the system.'
                  : 'Manage the actions available to this role.'}
              </p>
              {editable &&
                (permissions ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={cn(buttonClass.muted, 'h-11 text-[14px]')}
                      onClick={() => setPermissions(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={cn(buttonClass.primary, 'h-11 text-[14px]')}
                      disabled={!permissions.length || saving}
                      onClick={savePermissions}
                    >
                      {saving ? 'Saving…' : 'Save Permissions'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={cn(buttonClass.primary, 'h-11 text-[14px]')}
                    onClick={() => setPermissions([...role.permissionIds])}
                  >
                    Edit Permissions
                  </button>
                ))}
            </div>
            <PermissionTable
              showHeading={false}
              value={permissions ?? role.permissionIds}
              onChange={setPermissions}
              readOnly={permissions === null}
            />
          </TabsPrimitive.Content>
        </Panel>
      </TabsPrimitive.Root>

      {editing && (
        <EditRoleDialog key={role.id} role={role} roles={roles} onClose={() => setEditing(false)} />
      )}
      {moving && (
        <ChangeRoleDialog
          key={moving.id}
          staff={moving}
          role={role}
          roles={roles}
          onClose={() => setMoving(null)}
        />
      )}
    </AdminLayout>
  )
}

/** Moves a staff member out of `role` (each member holds exactly one role). */
function ChangeRoleDialog({
  staff,
  role,
  roles,
  onClose,
}: {
  staff: StaffMember
  role: Role
  roles: Role[]
  onClose: () => void
}) {
  const ownAccount = useIsOwnAccount(staff)
  const locked = ownAccount || staff.isRoot
  const [reassign, { isLoading }] = useReassignRoleMutation()
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')
  const name = staffName(staff)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next = roles.find((item) => item.id === target)
    if (!next || locked) return
    try {
      await reassign({ staffId: staff.id, roleId: next.id }).unwrap()
      toast.success(`${name} moved to ${next.name}`)
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Change Role"
      description={`Each admin holds one role. Choose the role ${name} should move to.`}
    >
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <SheetBody>
          <label htmlFor="move-role" className={labelClass}>
            New role
          </label>
          <SelectField
            id="move-role"
            value={target}
            disabled={locked}
            onValueChange={(value) => {
              setTarget(value)
              setError('')
            }}
            options={[
              { value: '', label: 'Select a role' },
              ...roles
                .filter((item) => item.id !== role.id && item.status === 'Active')
                .map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
          {locked && (
            <p className="mt-2 text-[13px] text-tf-muted">
              {ownAccount
                ? 'You can’t change your own role.'
                : 'The root account always holds the Super Admin role.'}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-tf-red">
              {error}
            </p>
          )}
        </SheetBody>
        <SheetFooter
          onCancel={onClose}
          submitLabel={isLoading ? 'Moving…' : 'Move Admin'}
          disabled={!target || locked || isLoading}
        />
      </form>
    </SheetDialog>
  )
}
