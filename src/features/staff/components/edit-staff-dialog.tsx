import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { SheetBody, SheetDialog, SheetFooter } from '@/components/testify/sheet-dialog'
import { SelectField } from '@/components/testify/select-field'
import { errorClass, fieldClass, labelClass } from '@/components/testify/form-styles'
import { errorMessage } from '@/lib/api/base-api'
import { useUpdateStaffMutation } from '@/features/roles/access-api'
import { phoneProblem, type StaffMember } from '@/features/roles/model'
import { useIsOwnAccount, useRoles } from '@/features/roles/use-access'

/** Edits a staff member's name, phone and role. Mount with a `key` to reset the form. */
export function EditStaffDialog({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  const { roles } = useRoles()
  const [updateStaff, { isLoading }] = useUpdateStaffMutation()
  // An admin can't change their own role, and the root account always holds Super Admin.
  const ownAccount = useIsOwnAccount(staff)
  const roleLocked = ownAccount || staff.isRoot
  const [firstName, setFirstName] = useState(staff.firstName)
  const [lastName, setLastName] = useState(staff.lastName)
  const [phone, setPhone] = useState(staff.phone)
  const [roleId, setRoleId] = useState(staff.roleId ?? '')
  const [phoneError, setPhoneError] = useState('')
  const [error, setError] = useState('')
  const changed =
    firstName.trim() !== staff.firstName ||
    lastName.trim() !== staff.lastName ||
    phone.trim() !== staff.phone ||
    roleId !== (staff.roleId ?? '')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!firstName.trim() || firstName.trim().length > 100)
      return setError('Enter a first name of 100 characters or fewer.')
    if (!lastName.trim() || lastName.trim().length > 100)
      return setError('Enter a last name of 100 characters or fewer.')
    const invalidPhone = phoneProblem(phone)
    if (invalidPhone) return setPhoneError(invalidPhone)
    if (!roleId) return setError('Select an assigned role.')
    try {
      await updateStaff({ id: staff.id, firstName, lastName, phone, roleId }).unwrap()
      toast.success('Staff details updated')
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
      description="Edit and update staff details."
    >
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <SheetBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-staff-first-name" className={labelClass}>
                First Name
              </label>
              <input
                id="edit-staff-first-name"
                maxLength={100}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="edit-staff-last-name" className={labelClass}>
                Last Name
              </label>
              <input
                id="edit-staff-last-name"
                maxLength={100}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-staff-email" className={labelClass}>
              Email Address
            </label>
            <input id="edit-staff-email" value={staff.email} readOnly className={fieldClass} />
          </div>
          <div>
            <label htmlFor="edit-staff-phone" className={labelClass}>
              Phone Number
            </label>
            <input
              id="edit-staff-phone"
              type="tel"
              value={phone}
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? 'edit-staff-phone-error' : undefined}
              onChange={(event) => {
                setPhone(event.target.value)
                setPhoneError('')
              }}
              className={fieldClass}
            />
            {phoneError && (
              <p id="edit-staff-phone-error" role="alert" className={errorClass}>
                {phoneError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="edit-staff-role" className={labelClass}>
              Role
            </label>
            <SelectField
              id="edit-staff-role"
              value={roleId}
              disabled={roleLocked}
              aria-describedby={roleLocked ? 'edit-staff-role-note' : undefined}
              onValueChange={setRoleId}
              options={[
                { value: '', label: 'Select role' },
                ...roles
                  .filter((role) => role.status === 'Active' || role.id === staff.roleId)
                  .map((role) => ({ value: role.id, label: role.name })),
              ]}
            />
            {roleLocked && (
              <p id="edit-staff-role-note" className="mt-2 text-[13px] text-tf-muted">
                {ownAccount
                  ? 'You can’t change your own role.'
                  : 'The root account always holds the Super Admin role.'}
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className={errorClass}>
              {error}
            </p>
          )}
        </SheetBody>
        <SheetFooter
          onCancel={onClose}
          cancelLabel="Close"
          submitLabel="Save"
          disabled={isLoading || !changed || !firstName.trim() || !lastName.trim() || !roleId}
        />
      </form>
    </SheetDialog>
  )
}
