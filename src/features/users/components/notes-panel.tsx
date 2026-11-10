import { useState, type FormEvent } from 'react'
import { Lock, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/store'
import { InfoCard } from '@/components/testify/panel'
import { SelectField } from '@/components/testify/select-field'
import { StatusPill, type PillTone } from '@/components/testify/status-pill'
import { buttonClass } from '@/components/testify/button-class'
import { textareaClass } from '@/components/testify/form-styles'
import { ConfirmDialog } from '@/components/testify/testify-dialog'
import { errorMessage } from '@/lib/api/base-api'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useAddNoteMutation,
  useDeleteNoteMutation,
  useGetNotesQuery,
  useUpdateNoteMutation,
  type Note,
  type NoteTag,
} from '../users-api'

const tagLabel: Record<NoteTag, string> = {
  warning: 'Warning',
  positive: 'Positive',
  neutral: 'Neutral',
  pending_review: 'Pending review',
}
const tagTone: Record<NoteTag, PillTone> = {
  warning: 'warning',
  positive: 'active',
  neutral: 'neutral',
  pending_review: 'review',
}
const tagOptions = [
  { value: '', label: 'No tag' },
  ...(Object.keys(tagLabel) as NoteTag[]).map((value) => ({ value, label: tagLabel[value] })),
]

function NoteForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: Note
  submitLabel: string
  busy: boolean
  onSubmit: (body: string, tag: NoteTag | null) => Promise<boolean>
  onCancel?: () => void
}) {
  const [body, setBody] = useState(initial?.body ?? '')
  const [tag, setTag] = useState<string>(initial?.tag ?? '')
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) return
    if ((await onSubmit(body, (tag || null) as NoteTag | null)) && !initial) {
      setBody('')
      setTag('')
    }
  }
  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor={initial ? `note-${initial.id}` : 'new-note'} className="sr-only">
        Note
      </label>
      <textarea
        id={initial ? `note-${initial.id}` : 'new-note'}
        value={body}
        maxLength={2000}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add context for other moderators: prior warnings, appeals, things to watch…"
        className={cn(textareaClass, 'h-[110px] text-[14px]')}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <SelectField
          aria-label="Note tag"
          size="sm"
          className="w-[170px]"
          options={tagOptions}
          value={tag}
          onValueChange={setTag}
        />
        <div className="ml-auto flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(buttonClass.muted, 'h-10 px-4 text-[13px]')}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className={cn(buttonClass.primary, 'h-10 px-5 text-[13px]')}
          >
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

/** Internal moderator notes about a member. Never shown to the member. */
export function NotesPanel({ userId, canWrite }: { userId: string; canWrite: boolean }) {
  const me = useAppSelector((state) => state.auth.session?.user.id)
  const { data: notes = [], isLoading } = useGetNotesQuery(userId)
  const [addNote, addState] = useAddNoteMutation()
  const [updateNote, updateState] = useUpdateNoteMutation()
  const [deleteNote] = useDeleteNoteMutation()
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Note | null>(null)

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      toast.success(success)
      return true
    } catch (cause) {
      toast.error(errorMessage(cause))
      return false
    }
  }

  return (
    <InfoCard
      title="Moderator Notes"
      action={
        <StatusPill tone="neutral" className="h-[30px] gap-1.5 px-3">
          <Lock className="size-3" aria-hidden /> Internal
        </StatusPill>
      }
    >
      <p className="mt-3 text-[13px] leading-5 text-tf-muted">
        Visible to moderators only, never to the member.
      </p>
      {canWrite && (
        <NoteForm
          submitLabel="Add Note"
          busy={addState.isLoading}
          onSubmit={(body, tag) => run(() => addNote({ userId, body, tag }).unwrap(), 'Note added')}
        />
      )}
      {isLoading ? (
        <p className="mt-6 text-[14px] text-tf-muted">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="mt-6 text-[14px] text-tf-muted">No notes yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-[#2f3540]" aria-label="Moderator notes">
          {notes.map((note) => {
            const mine = !!me && note.author?.id === me
            return (
              <li key={note.id} className="py-4">
                {editing === note.id ? (
                  <NoteForm
                    initial={note}
                    submitLabel="Save"
                    busy={updateState.isLoading}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (body, tag) => {
                      const ok = await run(
                        () => updateNote({ userId, noteId: note.id, body, tag }).unwrap(),
                        'Note updated',
                      )
                      if (ok) setEditing(null)
                      return ok
                    }}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] leading-5 break-words whitespace-pre-line">
                        {note.body}
                      </p>
                      {canWrite && mine && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            aria-label="Edit note"
                            onClick={() => setEditing(note.id)}
                            className="grid size-8 place-items-center rounded-full text-tf-muted hover:bg-white/10 hover:text-white"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete note"
                            onClick={() => setDeleting(note)}
                            className="grid size-8 place-items-center rounded-full text-tf-muted hover:bg-white/10 hover:text-tf-red"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-tf-dim">
                      {note.tag && (
                        <StatusPill tone={tagTone[note.tag]} className="h-6 px-2.5 text-[11px]">
                          {tagLabel[note.tag]}
                        </StatusPill>
                      )}
                      {note.author?.name ?? 'Former admin'} · {formatDateTime(note.createdAt)}
                      {note.updatedAt && ' · edited'}
                    </p>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        icon={<Trash2 />}
        title="Delete this note?"
        description="The note will be removed for every moderator."
        confirmLabel="Delete Note"
        onConfirm={async () => {
          const note = deleting
          setDeleting(null)
          if (note)
            await run(() => deleteNote({ userId, noteId: note.id }).unwrap(), 'Note deleted')
        }}
      />
    </InfoCard>
  )
}
