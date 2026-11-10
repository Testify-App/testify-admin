import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShieldOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Panel } from '@/components/testify/panel'
import { buttonClass } from '@/components/testify/button-class'
import { SearchField } from '@/components/testify/search-field'
import { ConfirmDialog } from '@/components/testify/testify-dialog'
import { SheetBody, SheetDialog, SheetFooter } from '@/components/testify/sheet-dialog'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/api/base-api'
import { usePermission } from '@/features/auth/use-permission'
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useReassignRoleMutation,
  useSetRoleActiveMutation,
  useUpdateRoleMutation,
} from './access-api'
import { emptyStatusFilters, matchesStatusFilters } from './filters'
import {
  emptyDraft,
  validateRoleDescription,
  validateRoleName,
  type Role,
  type RoleDraft,
} from './model'
import { useRoles } from './use-access'
import { assignStaff } from './assign-staff'
import { AdminPicker } from './components/admin-picker'
import { PermissionTable } from './components/permission-table'
import { RoleCard } from './components/role-card'
import { RoleFields } from './components/role-fields'
import { RoleSetupHeader } from './components/role-setup-header'
import { StatusFilters } from './components/status-filters'
import { StepNavigation } from './components/step-navigation'

export function RolesPage() {
  const navigate = useNavigate()
  const { roles, isLoading, isError, refetch } = useRoles()
  const canCreate = usePermission('roles:create')
  const canUpdate = usePermission('roles:update')
  const canDelete = usePermission('roles:delete')
  const [createRole, { isLoading: creating }] = useCreateRoleMutation()
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation()
  const [deleteRoleRequest] = useDeleteRoleMutation()
  const [setRoleActive] = useSetRoleActiveMutation()
  const [reassign, { isLoading: assigning }] = useReassignRoleMutation()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(emptyStatusFilters)
  const [draft, setDraft] = useState<RoleDraft | null>(null)
  const [step, setStep] = useState(0)
  // The role is saved when the permissions step is completed, so staff can be invited into it
  // in the final step.
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [discarding, setDiscarding] = useState(false)
  const [deleting, setDeleting] = useState<Role | null>(null)
  const searchInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const term = search.trim().toLowerCase()
  const filtered = roles.filter(
    (role) => role.name.toLowerCase().includes(term) && matchesStatusFilters(role, filters),
  )
  const created = roles.find((role) => role.id === createdId)

  function close() {
    setDraft(null)
    setStep(0)
    setCreatedId(null)
    setNameError('')
    setDescriptionError('')
  }
  // Leaving the details step mid-setup returns to the permissions step instead of discarding.
  const midSetup = !!createdId || !!draft?.permissionIds.length
  const closeDetails = () => (midSetup ? setStep(1) : close())
  function submitDetails(event: FormEvent) {
    event.preventDefault()
    if (!draft) return
    const name = validateRoleName(draft.name, roles, createdId ?? undefined)
    const description = validateRoleDescription(draft.description)
    setNameError(name)
    setDescriptionError(description)
    if (!name && !description) setStep(1)
  }
  async function savePermissions() {
    if (!draft?.permissionIds.length) return
    try {
      if (createdId) await updateRole({ id: createdId, ...draft }).unwrap()
      else setCreatedId((await createRole(draft).unwrap()).id)
      setStep(2)
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }
  async function finish() {
    if (!draft || !createdId) return
    const id = createdId
    const { failed, reason } = await assignStaff(reassign, draft.staffIds, id)
    close()
    if (failed)
      toast.error(`${failed} admin${failed === 1 ? '' : 's'} could not be added: ${reason}`)
    toast.success('Role created successfully')
    navigate(`/roles/${id}`)
  }
  async function discard() {
    setDiscarding(false)
    if (createdId) {
      try {
        await deleteRoleRequest(createdId).unwrap()
      } catch (cause) {
        return void toast.error(
          errorMessage(cause, 'Staff invited to this role must be moved before it is discarded.'),
        )
      }
    }
    close()
  }
  async function deleteRole() {
    const role = deleting
    setDeleting(null)
    if (!role) return
    if (role.adminCount)
      return void toast.error(
        `Move the ${role.adminCount === 1 ? 'admin' : `${role.adminCount} admins`} holding ${role.name} to another role first.`,
      )
    try {
      await deleteRoleRequest(role.id).unwrap()
      toast.success('Role deleted')
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }
  async function toggleStatus(role: Role) {
    const active = role.status !== 'Active'
    try {
      await setRoleActive({ id: role.id, active }).unwrap()
      toast.success(`${role.name} ${active ? 'activated' : 'deactivated'}`)
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }

  const discardDialog = (
    <ConfirmDialog
      open={discarding}
      onOpenChange={setDiscarding}
      icon={<Trash2 />}
      title="Discard this role?"
      description={
        createdId
          ? 'This role has already been saved and will be deleted.'
          : 'The details and permissions you entered will be discarded.'
      }
      confirmLabel="Discard Role"
      onConfirm={discard}
    />
  )

  if (draft && step > 0)
    return (
      <AdminLayout title="Add New Role" backTo="/roles">
        <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Panel className="p-6 xl:sticky xl:top-6">
            <StepNavigation step={step} onStepChange={setStep} />
          </Panel>
          <Panel className="min-w-0 p-5 sm:p-8">
            {step === 1 ? (
              <>
                <RoleSetupHeader
                  name={draft.name}
                  description={draft.description}
                  onEdit={() => setStep(0)}
                  onDiscard={() => setDiscarding(true)}
                />
                <PermissionTable
                  value={draft.permissionIds}
                  onChange={(permissionIds) => setDraft({ ...draft, permissionIds })}
                />
              </>
            ) : (
              <>
                <h2 className="text-[24px] leading-8 font-semibold">Add Admin</h2>
                <p className="mt-1 mb-6 text-[15px] text-tf-periwinkle">
                  Select from your list of staff or invite a new admin to {draft.name}.
                </p>
                <AdminPicker
                  currentRole={created && { id: created.id, name: created.name }}
                  value={draft.staffIds}
                  onChange={(staffIds) => setDraft({ ...draft, staffIds })}
                />
              </>
            )}
            <div className="mt-8 flex flex-col justify-end gap-4 border-t border-tf-line pt-6 sm:flex-row">
              <button
                type="button"
                className={cn(buttonClass.muted, 'sm:w-[240px]')}
                onClick={() => {
                  close()
                  if (step === 2) toast.success('Role saved. You can add admins later.')
                }}
              >
                Back to Roles
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  className={cn(buttonClass.primary, 'sm:w-[240px]')}
                  disabled={!draft.permissionIds.length || creating || updating}
                  onClick={savePermissions}
                >
                  {creating || updating ? 'Saving…' : 'Save & Continue'}
                </button>
              ) : (
                <button
                  type="button"
                  className={cn(buttonClass.primary, 'sm:w-[240px]')}
                  disabled={assigning}
                  onClick={finish}
                >
                  {assigning ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </Panel>
        </div>
        {discardDialog}
      </AdminLayout>
    )

  return (
    <AdminLayout title="Roles & Permissions">
      <Panel className="px-5 py-6 sm:px-8">
        <h2 className="text-[24px] leading-8 font-semibold">
          List of Roles <span className="text-tf-lime">({roles.length})</span>
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex w-full flex-wrap items-center gap-4 sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <SearchField
                ref={searchInput}
                aria-label="Search roles"
                placeholder="Search by role name"
                value={search}
                onValueChange={setSearch}
                className="pr-14"
              />
              <kbd
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rounded-[6px] bg-tf-chip px-1.5 py-0.5 text-[11px] text-tf-muted"
              >
                ⌘ K
              </kbd>
            </div>
            <StatusFilters value={filters} onChange={setFilters} />
          </div>
          {canCreate && (
            <button
              type="button"
              className={cn(buttonClass.primary, 'h-[46px] px-6 text-[15px]')}
              onClick={() => {
                setDraft({ ...emptyDraft })
                setStep(0)
              }}
            >
              <Plus className="size-5" aria-hidden />
              Add New Role
            </button>
          )}
        </div>
      </Panel>

      {isLoading ? (
        <Panel className="mt-6 px-6 py-[70px] text-center">
          <p role="status" className="text-[14px] text-tf-muted">
            Loading roles…
          </p>
        </Panel>
      ) : isError ? (
        <Panel className="mt-6 flex flex-col items-center gap-3 px-6 py-[70px] text-center">
          <h3 className="text-[18px] font-semibold">We couldn’t load the roles</h3>
          <button
            type="button"
            className={cn(buttonClass.outline, 'mt-2 h-11 text-[14px]')}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </Panel>
      ) : filtered.length ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onDelete={canDelete ? () => setDeleting(role) : undefined}
              onStatusChange={canUpdate ? () => void toggleStatus(role) : undefined}
            />
          ))}
        </div>
      ) : (
        <Panel className="mt-6 flex flex-col items-center gap-3 px-6 py-[70px] text-center">
          <span className="grid size-20 place-items-center rounded-full bg-tf-card">
            <ShieldOff className="size-9 text-tf-dim" aria-hidden />
          </span>
          <h3 className="mt-2 text-[18px] font-semibold">No roles found</h3>
          <p className="text-[14px] text-tf-muted">Try a different search or clear the filters.</p>
          <button
            type="button"
            className={cn(buttonClass.outline, 'mt-2 h-11 text-[14px]')}
            onClick={() => {
              setSearch('')
              setFilters(emptyStatusFilters)
            }}
          >
            Clear filters
          </button>
        </Panel>
      )}

      <SheetDialog
        open={!!draft && step === 0}
        onOpenChange={(open) => !open && closeDetails()}
        title={midSetup ? 'Edit Details' : 'Add Role'}
        description="Add a name and a short description that better explains the responsibility of the role."
        className="max-w-[780px]"
      >
        <form onSubmit={submitDetails} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 overflow-y-auto sm:grid-cols-[260px_minmax(0,1fr)]">
            <div className="border-tf-line bg-tf-card/50 px-6 py-6 max-sm:border-b sm:border-r">
              <StepNavigation step={0} onStepChange={setStep} compact />
            </div>
            <SheetBody className="overflow-visible">
              {draft && (
                <RoleFields
                  value={draft}
                  onChange={(fields) => {
                    setDraft({ ...draft, ...fields })
                    setNameError('')
                    setDescriptionError('')
                  }}
                  error={nameError}
                  descriptionError={descriptionError}
                />
              )}
            </SheetBody>
          </div>
          <SheetFooter
            onCancel={closeDetails}
            cancelLabel="Close"
            submitLabel={midSetup ? 'Continue' : 'Add Role'}
            disabled={!draft?.name.trim() || !draft.description.trim()}
          />
        </form>
      </SheetDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        icon={<Trash2 />}
        title={`Delete ${deleting?.name ?? 'role'}?`}
        description="A role can only be deleted once no admins are assigned to it."
        confirmLabel="Delete Role"
        onConfirm={deleteRole}
      />
      {discardDialog}
    </AdminLayout>
  )
}
