import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { SheetBody, SheetDialog, SheetFooter } from '@/components/testify/sheet-dialog'
import { textareaClass } from '@/components/testify/form-styles'
import { cn } from '@/lib/utils'
import { errorClass } from '@/components/testify/form-styles'
import { errorMessage } from '@/lib/api/base-api'
import { useSuspendStaffMutation } from '@/features/roles/access-api'
import { staffName, type StaffMember } from '@/features/roles/model'

const reasons = [
  'Fraudulent activities.',
  'Breached organisational policies or access rules.',
  'Admin layoff/Resignation.',
]
const NOTE_MAX = 200

export function SuspendStaffDialog({
  staff,
  onClose,
}: {
  staff: StaffMember
  onClose: () => void
}) {
  const [suspend, { isLoading }] = useSuspendStaffMutation()
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const detail = [reason, note.trim()].filter(Boolean).join(' ')
    if (!detail) return
    try {
      await suspend({ id: staff.id, reason: detail }).unwrap()
      toast.success(`${staffName(staff)} has been suspended`)
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Suspend Admin"
      description="Select a reason to keep the admin informed and maintain accurate records."
    >
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <SheetBody>
          <fieldset>
            <legend className="sr-only">Suspension reason</legend>
            <div className="space-y-3">
              {reasons.map((item) => {
                const checked = reason === item
                return (
                  <label
                    key={item}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-[16px] border bg-tf-field px-5 py-4 text-[14px] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tf-lime/50',
                      checked ? 'border-tf-lime' : 'border-transparent',
                    )}
                  >
                    <input
                      type="radio"
                      name="suspension-reason"
                      value={item}
                      checked={checked}
                      onChange={() => setReason(item)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]',
                        checked ? 'border-tf-lime text-tf-lime' : 'border-tf-grey',
                      )}
                    >
                      {checked && <Check className="size-2.5" strokeWidth={3.5} />}
                    </span>
                    {item}
                  </label>
                )
              })}
            </div>
          </fieldset>
          <div className="mt-6 border-t border-tf-line pt-6">
            <div className="mb-3 flex justify-between">
              <label htmlFor="suspension-note" className="text-[16px] font-semibold">
                Or add a note
              </label>
              <span className="text-[12px] text-tf-dim tabular-nums">
                {note.length}/{NOTE_MAX}
              </span>
            </div>
            <textarea
              id="suspension-note"
              placeholder="Write a note…"
              maxLength={NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={cn(textareaClass, 'h-[140px]')}
            />
          </div>
          {error && (
            <p role="alert" className={cn(errorClass, 'mt-4')}>
              {error}
            </p>
          )}
        </SheetBody>
        <SheetFooter
          onCancel={onClose}
          submitLabel="Suspend"
          destructive
          disabled={isLoading || (!reason && !note.trim())}
        />
      </form>
    </SheetDialog>
  )
}
