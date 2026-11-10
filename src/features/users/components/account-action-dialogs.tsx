import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { SheetBody, SheetDialog, SheetFooter } from '@/components/testify/sheet-dialog'
import { SelectField } from '@/components/testify/select-field'
import { errorClass, labelClass, textareaClass } from '@/components/testify/form-styles'
import { errorMessage } from '@/lib/api/base-api'
import { cn } from '@/lib/utils'
import { useGetReportReasonsQuery } from '@/features/moderation/moderation-api'
import {
  useBanUserMutation,
  useChangeSuspensionMutation,
  useGetWarningTemplatesQuery,
  useReinstateUserMutation,
  useSendWarningMutation,
  useSuspendUserMutation,
  type StandingInput,
} from '../users-api'

export type AccountDialog = 'warning' | 'suspend' | 'change-suspension' | 'ban' | 'reinstate'

const durationOptions = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'indefinite', label: 'Indefinite (until reinstated)' },
]

const reinstateReasons = [
  { value: '', label: 'Select a reason (optional)' },
  { value: 'Time served', label: 'Time served' },
  { value: 'Appeal approved', label: 'Appeal approved' },
  { value: 'Reviewed in error', label: 'Reviewed in error' },
]

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  children: string
}) {
  return (
    <label className="mt-6 flex cursor-pointer items-center gap-3 text-[14px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[#d9ef00]"
      />
      {children}
    </label>
  )
}

function NoteField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="mt-6">
      <label htmlFor={id} className={labelClass}>
        {label} <span className="text-[13px] font-normal text-tf-muted">(Optional)</span>
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={500}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(textareaClass, 'h-[110px]')}
      />
    </div>
  )
}

/**
 * Warning, suspension, ban and reinstatement for one member. Each submits once, then closes;
 * the API records the action in the member's history and the audit log.
 */
export function AccountActionDialog({
  dialog,
  user,
  onClose,
}: {
  dialog: AccountDialog
  user: { id: string; username: string | null }
  onClose: () => void
}) {
  const handle = `@${user.username ?? 'member'}`
  const { data: reasons = [] } = useGetReportReasonsQuery(undefined, {
    skip: dialog === 'warning' || dialog === 'reinstate',
  })
  const { data: templates = [] } = useGetWarningTemplatesQuery(undefined, {
    skip: dialog !== 'warning',
  })
  const [suspend, suspendState] = useSuspendUserMutation()
  const [changeSuspension, changeState] = useChangeSuspensionMutation()
  const [ban, banState] = useBanUserMutation()
  const [reinstate, reinstateState] = useReinstateUserMutation()
  const [sendWarning, warningState] = useSendWarningMutation()
  const busy = [suspendState, changeState, banState, reinstateState, warningState].some(
    (state) => state.isLoading,
  )

  const [duration, setDuration] = useState('7')
  const [reasonCode, setReasonCode] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [template, setTemplate] = useState('')
  const [message, setMessage] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [error, setError] = useState('')

  const config = {
    warning: {
      title: 'Send Warning',
      description: `Alert ${handle} about their behaviour before taking stronger action.`,
      submit: 'Send Warning',
      destructive: false,
    },
    suspend: {
      title: 'Suspend Account',
      description: `${handle} won’t be able to sign in, post or message while suspended.`,
      submit: 'Suspend',
      destructive: true,
    },
    'change-suspension': {
      title: 'Change Suspension',
      description: `Set a new end for ${handle}’s suspension, counted from now.`,
      submit: 'Update Suspension',
      destructive: false,
    },
    ban: {
      title: 'Ban Permanently',
      description: `${handle} will be permanently restricted from Testify. Bans can’t be lifted.`,
      submit: 'Ban Account',
      destructive: true,
    },
    reinstate: {
      title: 'Reinstate Account',
      description: `${handle} will regain full access to sign in and post.`,
      submit: 'Reinstate',
      destructive: false,
    },
  }[dialog]

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const reasonLabel = reasons.find((item) => item.code === reasonCode)?.label
    const input: StandingInput = {
      userId: user.id,
      durationDays: duration === 'indefinite' ? null : Number(duration),
      reasonCode,
      reason: reason.trim() || reasonLabel,
      note,
      notify,
    }
    try {
      if (dialog === 'warning') {
        if (!template && !message.trim()) return setError('Choose a template or write a message.')
        await sendWarning({
          userId: user.id,
          templateKey: template && !message.trim() ? template : undefined,
          message,
          sendEmail,
        }).unwrap()
        toast.success(`Warning sent to ${handle}`)
      } else if (dialog === 'suspend') {
        await suspend(input).unwrap()
        toast.success(`${handle} has been suspended`)
      } else if (dialog === 'change-suspension') {
        await changeSuspension(input).unwrap()
        toast.success('Suspension updated')
      } else if (dialog === 'ban') {
        await ban({ ...input, durationDays: undefined }).unwrap()
        toast.success(`${handle} has been banned`)
      } else {
        await reinstate({ ...input, durationDays: undefined, reason: reason || undefined }).unwrap()
        toast.success(`${handle} has been reinstated`)
      }
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={config.title}
      description={config.description}
    >
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <SheetBody>
          {dialog === 'warning' && (
            <>
              <label htmlFor="warning-template" className={labelClass}>
                Template
              </label>
              <SelectField
                id="warning-template"
                value={template}
                onValueChange={(value) => {
                  setTemplate(value)
                  setMessage(templates.find((item) => item.key === value)?.message ?? '')
                }}
                options={[
                  { value: '', label: 'Custom message' },
                  ...templates.map((item) => ({ value: item.key, label: item.label })),
                ]}
              />
              <div className="mt-6">
                <label htmlFor="warning-message" className={labelClass}>
                  Message
                </label>
                <textarea
                  id="warning-message"
                  value={message}
                  maxLength={1000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Explain what the member did and what needs to change."
                  className={cn(textareaClass, 'h-[160px]')}
                />
              </div>
              <Checkbox checked={sendEmail} onChange={setSendEmail}>
                Also send the warning by email
              </Checkbox>
              <p className="mt-3 text-[13px] text-tf-muted">
                The member sees it as an in-app notification and is asked to acknowledge it.
              </p>
            </>
          )}

          {(dialog === 'suspend' || dialog === 'change-suspension') && (
            <>
              <label htmlFor="suspend-duration" className={labelClass}>
                {dialog === 'suspend' ? 'Suspend for' : 'New length'}
              </label>
              <SelectField
                id="suspend-duration"
                value={duration}
                onValueChange={setDuration}
                options={durationOptions}
              />
            </>
          )}

          {(dialog === 'suspend' || dialog === 'ban') && (
            <div className={dialog === 'suspend' ? 'mt-6' : undefined}>
              <label htmlFor="restriction-reason" className={labelClass}>
                Reason
              </label>
              <SelectField
                id="restriction-reason"
                value={reasonCode}
                onValueChange={setReasonCode}
                options={[
                  { value: '', label: 'Select a reason (optional)' },
                  ...reasons.map((item) => ({ value: item.code, label: item.label })),
                ]}
              />
            </div>
          )}

          {dialog === 'reinstate' && (
            <>
              <label htmlFor="reinstate-reason" className={labelClass}>
                Reason
              </label>
              <SelectField
                id="reinstate-reason"
                value={reason}
                onValueChange={setReason}
                options={reinstateReasons}
              />
            </>
          )}

          {dialog !== 'warning' && (
            <>
              <NoteField
                id="action-note"
                label="Internal note"
                value={note}
                onChange={setNote}
                placeholder="Context for other moderators (not shown to the member)."
              />
              <Checkbox checked={notify} onChange={setNotify}>
                Notify the member (in-app and email)
              </Checkbox>
            </>
          )}

          {error && (
            <p role="alert" className={cn(errorClass, 'mt-5 text-[14px]')}>
              {error}
            </p>
          )}
        </SheetBody>
        <SheetFooter
          onCancel={onClose}
          cancelLabel="Cancel"
          submitLabel={busy ? 'Saving…' : config.submit}
          destructive={config.destructive}
          disabled={busy}
        />
      </form>
    </SheetDialog>
  )
}
