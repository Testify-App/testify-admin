import { Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { buttonClass } from '@/components/testify/button-class'
import { cn } from '@/lib/utils'

/** Role being set up, shown above the permissions step. */
export function RoleSetupHeader({
  name,
  description,
  onEdit,
  onDiscard,
}: {
  name: string
  description: string
  onEdit: () => void
  onDiscard: () => void
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[16px] bg-tf-stat p-5">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-tf-lime text-tf-page">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[20px] leading-7 font-semibold break-words">{name}</h2>
          <p className="mt-1 text-[14px] leading-5 text-[#e9edf7]/70">
            {description || 'Set the permissions for this role.'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onEdit}
          className={cn(buttonClass.outline, 'h-11 px-5 text-[14px]')}
        >
          <Pencil className="size-4" aria-hidden />
          Edit Details
        </button>
        <button
          type="button"
          onClick={onDiscard}
          aria-label="Discard role"
          className="grid size-11 place-items-center rounded-full bg-tf-red text-white hover:bg-[#d63a2d]"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}
