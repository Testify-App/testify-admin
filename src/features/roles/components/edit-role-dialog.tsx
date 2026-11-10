import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { SheetBody, SheetDialog, SheetFooter } from '@/components/testify/sheet-dialog'
import { errorMessage } from '@/lib/api/base-api'
import { useUpdateRoleMutation } from '../access-api'
import { validateRoleDescription, validateRoleName, type Role } from '../model'
import { RoleFields } from './role-fields'

/** Edits an existing role's name and description. Mount with a `key` to reset the form. */
export function EditRoleDialog({
  role,
  roles,
  onClose,
}: {
  role: Role
  roles: Pick<Role, 'id' | 'name'>[]
  onClose: () => void
}) {
  const [updateRole, { isLoading }] = useUpdateRoleMutation()
  const [fields, setFields] = useState({ name: role.name, description: role.description })
  const [error, setError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const unchanged =
    fields.name.trim() === role.name && fields.description.trim() === role.description

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nameProblem = validateRoleName(fields.name, roles, role.id)
    const descriptionProblem = validateRoleDescription(fields.description)
    setError(nameProblem)
    setDescriptionError(descriptionProblem)
    if (nameProblem || descriptionProblem) return
    try {
      await updateRole({ id: role.id, ...fields, permissionIds: role.permissionIds }).unwrap()
      toast.success('Role details updated')
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Edit Details"
      description="Update the name and the short description that explains this role."
    >
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <SheetBody>
          <RoleFields
            value={fields}
            onChange={(next) => {
              setFields(next)
              setError('')
              setDescriptionError('')
            }}
            error={error}
            descriptionError={descriptionError}
          />
        </SheetBody>
        <SheetFooter
          onCancel={onClose}
          cancelLabel="Close"
          submitLabel="Save"
          disabled={isLoading || unchanged || !fields.name.trim() || !fields.description.trim()}
        />
      </form>
    </SheetDialog>
  )
}
