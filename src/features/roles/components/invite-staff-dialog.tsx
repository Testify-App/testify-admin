import { useRef, useState, type FormEvent } from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { FileSpreadsheet, FileText, FolderUp } from 'lucide-react'
import { toast } from 'sonner'
import { SheetBody, SheetDialog, SheetFooter } from '@/components/testify/sheet-dialog'
import { SelectField } from '@/components/testify/select-field'
import { errorClass, fieldClass, labelClass } from '@/components/testify/form-styles'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/api/base-api'
import {
  useBulkInviteMutation,
  useInviteStaffMutation,
  usePreviewInvitesMutation,
  type StaffInvitation,
} from '../access-api'
import { phoneProblem } from '../model'
import {
  inviteTemplate,
  maxInviteFileSize,
  mergeServerReview,
  reviewInviteCsv,
  validateInvitation,
  type BulkInviteRow,
} from '../staff-invitations'
import { useRoles } from '../use-access'
import { BulkInvitePreview, BulkInviteProgress } from './bulk-invite-preview'

const emptyEntry = (roleId = ''): StaffInvitation => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  roleId,
})

const segmentClass =
  'h-11 flex-1 rounded-full text-[14px] font-medium text-tf-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-tf-lime/60 data-[state=active]:bg-tf-lime data-[state=active]:text-tf-page'

export function InviteStaffDialog({
  open,
  onOpenChange,
  currentRole,
  onInvited,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selects this role for new invitations. */
  currentRole?: { id: string; name: string }
  onInvited?: () => void
}) {
  const { roles: allRoles } = useRoles()
  // Staff can only be invited into active roles.
  const roles = allRoles.filter((role) => role.status === 'Active' || role.id === currentRole?.id)
  const [inviteStaff, { isLoading: inviting }] = useInviteStaffMutation()
  const [previewInvites] = usePreviewInvitesMutation()
  const [bulkInvite, { isLoading: sending }] = useBulkInviteMutation()
  const [tab, setTab] = useState('individual')
  const [entry, setEntry] = useState(() => emptyEntry(currentRole?.id))
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<BulkInviteRow[]>([])
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [step, setStep] = useState<'entry' | 'processing' | 'preview'>('entry')
  const fileInput = useRef<HTMLInputElement>(null)
  const loadId = useRef(0)
  const validRows = rows.filter((row) => row.status === 'valid')

  function changeOpen(next: boolean) {
    if (!next) {
      loadId.current++
      setTab('individual')
      setEntry(emptyEntry(currentRole?.id))
      setFile(null)
      setRows([])
      setError('')
      setPhoneError('')
      setStep('entry')
    }
    onOpenChange(next)
  }
  function chooseFile(selected?: File) {
    loadId.current++
    setRows([])
    setFile(null)
    setError('')
    setStep('entry')
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.csv'))
      return setError('Only CSV files are allowed. Use the downloadable template.')
    if (selected.size > maxInviteFileSize) return setError('Choose a CSV smaller than 4 MB.')
    setFile(selected)
  }
  async function previewFile() {
    if (!file) return
    const request = ++loadId.current
    setError('')
    setStep('processing')
    try {
      const reviewed = reviewInviteCsv(await file.text(), allRoles)
      const ready = reviewed.filter((row) => row.status === 'valid')
      const server = ready.length ? await previewInvites(ready).unwrap() : []
      if (request !== loadId.current) return
      setRows(mergeServerReview(reviewed, server))
      setStep('preview')
    } catch (cause) {
      if (request !== loadId.current) return
      setError(
        cause instanceof Error ? cause.message : errorMessage(cause, 'Unable to read this CSV.'),
      )
      setStep('entry')
    }
  }
  function saveTemplate() {
    const url = URL.createObjectURL(
      new Blob([inviteTemplate(currentRole?.id)], { type: 'text/csv;charset=utf-8' }),
    )
    Object.assign(document.createElement('a'), {
      href: url,
      download: 'staff-bulk-invite-template.csv',
    }).click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (step === 'processing' || inviting || sending) return
    if (tab === 'bulk') {
      if (step === 'entry') return void previewFile()
      try {
        const results = await bulkInvite(validRows).unwrap()
        const invited = results.filter((row) => row.status === 'invited').length
        const skipped = results.length - invited
        if (invited)
          toast.success(`${invited === 1 ? 'Invitation' : `${invited} invitations`} sent`)
        if (skipped)
          toast.error(
            `${skipped} ${skipped === 1 ? 'invitation' : 'invitations'} could not be sent: ${
              results.find((row) => row.status !== 'invited')?.reason ?? 'unknown error'
            }`,
          )
      } catch (cause) {
        return setError(errorMessage(cause))
      }
    } else {
      const invalidPhone = phoneProblem(entry.phone)
      if (invalidPhone) return setPhoneError(invalidPhone)
      const validation = validateInvitation(entry)
      if (validation) return setError(validation)
      try {
        const invited = await inviteStaff(entry).unwrap()
        toast.success(`Invitation sent to ${invited.email}`)
      } catch (cause) {
        return setError(errorMessage(cause))
      }
    }
    onInvited?.()
    changeOpen(false)
  }

  const disabled =
    step === 'processing' ||
    inviting ||
    sending ||
    (tab === 'bulk'
      ? step === 'preview'
        ? !validRows.length
        : !file
      : !entry.firstName.trim() || !entry.lastName.trim() || !entry.email.trim() || !entry.roleId)
  const set = (field: keyof StaffInvitation) => (value: string) => {
    setEntry({ ...entry, [field]: value })
    setError('')
  }

  return (
    <SheetDialog
      open={open}
      onOpenChange={changeOpen}
      title={step === 'preview' ? 'Preview Upload' : 'Invite Staff'}
      description={
        step === 'preview'
          ? 'Preview your staff upload list.'
          : 'Enter staff details to invite them.'
      }
      className={step === 'preview' ? 'max-w-[780px]' : undefined}
    >
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        {step === 'processing' ? (
          <BulkInviteProgress />
        ) : step === 'preview' ? (
          <BulkInvitePreview
            rows={rows}
            onReplace={() => {
              setStep('entry')
              setRows([])
              setFile(null)
              setError('')
            }}
          />
        ) : (
          <SheetBody>
            <TabsPrimitive.Root
              value={tab}
              onValueChange={(value) => {
                setTab(value)
                setError('')
              }}
            >
              <TabsPrimitive.List
                aria-label="Invite method"
                className="mb-6 flex rounded-full bg-tf-field p-1"
              >
                <TabsPrimitive.Trigger value="individual" className={segmentClass}>
                  Individual Entry
                </TabsPrimitive.Trigger>
                <TabsPrimitive.Trigger value="bulk" className={segmentClass}>
                  Bulk Upload
                </TabsPrimitive.Trigger>
              </TabsPrimitive.List>
              <TabsPrimitive.Content value="individual" className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="invite-first-name" className={labelClass}>
                      First Name
                    </label>
                    <input
                      id="invite-first-name"
                      placeholder="First name"
                      maxLength={100}
                      value={entry.firstName}
                      onChange={(event) => set('firstName')(event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="invite-last-name" className={labelClass}>
                      Last Name
                    </label>
                    <input
                      id="invite-last-name"
                      placeholder="Last name"
                      maxLength={100}
                      value={entry.lastName}
                      onChange={(event) => set('lastName')(event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="invite-email" className={labelClass}>
                    Email Address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    placeholder="Enter email address"
                    value={entry.email}
                    onChange={(event) => set('email')(event.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="invite-phone" className={labelClass}>
                    Phone Number{' '}
                    <span className="text-[13px] font-normal text-tf-muted">(Optional)</span>
                  </label>
                  <input
                    id="invite-phone"
                    type="tel"
                    placeholder="+234 803 555 0100"
                    value={entry.phone}
                    aria-invalid={!!phoneError}
                    aria-describedby={phoneError ? 'invite-phone-error' : undefined}
                    onChange={(event) => {
                      set('phone')(event.target.value)
                      setPhoneError('')
                    }}
                    className={fieldClass}
                  />
                  {phoneError && (
                    <p id="invite-phone-error" role="alert" className={errorClass}>
                      {phoneError}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="invite-role" className={labelClass}>
                    Assigned Role
                  </label>
                  <SelectField
                    id="invite-role"
                    value={entry.roleId}
                    onValueChange={set('roleId')}
                    options={[
                      { value: '', label: 'Select an option' },
                      ...roles.map((role) => ({ value: role.id, label: role.name })),
                    ]}
                  />
                </div>
              </TabsPrimitive.Content>
              <TabsPrimitive.Content value="bulk">
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  aria-label="Upload staff CSV"
                  className="sr-only"
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    chooseFile(event.dataTransfer.files[0])
                  }}
                  className="flex min-h-64 flex-col items-center justify-center rounded-[20px] border border-dashed border-tf-outline bg-tf-card p-6 text-center text-[14px] text-tf-muted"
                >
                  {file ? (
                    <FileText className="mb-4 size-12 text-tf-lime" aria-hidden />
                  ) : (
                    <FolderUp className="mb-4 size-12 text-tf-gold" aria-hidden />
                  )}
                  <p className="text-white">
                    {file ? (
                      file.name
                    ) : (
                      <>
                        Drag, or{' '}
                        <button
                          type="button"
                          className="text-tf-lime underline"
                          onClick={() => fileInput.current?.click()}
                        >
                          choose file
                        </button>{' '}
                        to upload
                      </>
                    )}
                  </p>
                  <p className="mt-2 text-[12px]">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB • Ready to preview`
                      : 'Only CSV files allowed and must not exceed 4 MB'}
                  </p>
                  {file && (
                    <button
                      type="button"
                      className="mt-3 text-[13px] text-tf-lime underline"
                      onClick={() => chooseFile()}
                    >
                      Remove file
                    </button>
                  )}
                </div>
                <p className="mt-4 flex flex-wrap items-center gap-1.5 text-[13px] text-tf-muted">
                  <FileSpreadsheet className="size-4 text-tf-lime" aria-hidden />
                  <button type="button" className="text-tf-lime underline" onClick={saveTemplate}>
                    Download Template
                  </button>
                  to upload multiple admins.
                </p>
                <details className="mt-3 text-[13px] text-tf-muted">
                  <summary className="cursor-pointer">Role IDs for the role_id column</summary>
                  <ul className="mt-2 space-y-1.5">
                    {roles.map((role) => (
                      <li key={role.id} className="flex justify-between gap-3">
                        <span>{role.name}</span>
                        <code className="break-all text-tf-silver">{role.id}</code>
                      </li>
                    ))}
                  </ul>
                </details>
              </TabsPrimitive.Content>
            </TabsPrimitive.Root>
            {error && (
              <p role="alert" className={cn(errorClass, 'mt-5 text-[14px]')}>
                {error}
              </p>
            )}
          </SheetBody>
        )}
        {step !== 'processing' && (
          <SheetFooter
            onCancel={() => changeOpen(false)}
            cancelLabel="Close"
            disabled={disabled}
            submitLabel={
              tab === 'bulk'
                ? step === 'preview'
                  ? `Send Invites${validRows.length ? ` (${validRows.length})` : ''}`
                  : 'Upload'
                : 'Send Invite'
            }
          />
        )}
      </form>
    </SheetDialog>
  )
}
