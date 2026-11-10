import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { buttonClass } from './button-class'

/**
 * “Filter” pill that opens a dark panel of draft filters. The draft is copied from `value` on open
 * and only applied on submit.
 */
export function FilterPopover<T>({
  value,
  onApply,
  empty,
  count,
  isEqual,
  isInvalid = () => false,
  label = 'Filters',
  children,
}: {
  value: T
  onApply: (value: T) => void
  /** Draft used by “Clear Selection”. */
  empty: T
  /** Number of applied filter groups, shown on the trigger. */
  count: number
  isEqual: (a: T, b: T) => boolean
  /** Blocks applying, e.g. an inverted date range. */
  isInvalid?: (draft: T) => boolean
  label?: string
  children: (draft: T, setDraft: (draft: T) => void, id: string) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const id = useId()
  const invalid = isInvalid(draft)
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(value)
        setOpen(next)
      }}
    >
      <PopoverTrigger
        aria-label={count ? `Filter (${count} active)` : 'Filter'}
        className={cn(
          'flex h-[46px] items-center gap-[10px] rounded-full border px-5 text-[14px] transition-colors',
          count
            ? 'border-tf-lime/60 text-tf-lime'
            : 'border-tf-outline text-tf-grey hover:text-white',
        )}
      >
        <SlidersHorizontal className="size-[18px]" aria-hidden />
        Filter
        {count > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-tf-lime text-[11px] font-semibold text-tf-page">
            {count}
          </span>
        )}
        <ChevronDown className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        aria-labelledby={`${id}-title`}
        className="w-[360px] max-w-[calc(100vw-24px)] rounded-[20px] border-tf-line bg-tf-card p-0 font-dm-sans text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
      >
        <form
          aria-label={label}
          onSubmit={(event) => {
            event.preventDefault()
            if (invalid) return
            onApply(draft)
            setOpen(false)
          }}
        >
          <div className="flex items-center justify-between border-b border-tf-line px-5 py-4">
            <h3 id={`${id}-title`} className="text-[16px] font-semibold">
              Filter by
            </h3>
            <PopoverClose
              aria-label="Close filters"
              className="grid size-7 place-items-center rounded-full text-tf-muted hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </PopoverClose>
          </div>
          <div className="divide-y divide-tf-line px-5">{children(draft, setDraft, id)}</div>
          <div className="grid grid-cols-2 gap-3 border-t border-tf-line px-5 py-4">
            <button
              type="button"
              className={cn(buttonClass.muted, 'h-11 text-[14px]')}
              onClick={() => setDraft(empty)}
            >
              Clear Selection
            </button>
            <button
              type="submit"
              disabled={invalid || isEqual(draft, value)}
              className={cn(buttonClass.primary, 'h-11 text-[14px]')}
            >
              Apply filter(s)
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

/** From / To date inputs with range validation. */
export function DateRangeFields({
  id,
  legend,
  from,
  to,
  onChange,
}: {
  id: string
  legend: string
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
}) {
  const invalid = !!from && !!to && from > to
  return (
    <fieldset className="py-4">
      <legend className="float-left mb-3 w-full text-[14px] font-medium">{legend}</legend>
      <div className="clear-both grid grid-cols-2 gap-3">
        {(['from', 'to'] as const).map((field) => (
          <div key={field} className="min-w-0">
            <label htmlFor={`${id}-${field}`} className="mb-1.5 block text-[12px] text-tf-muted">
              {field === 'from' ? 'From' : 'To'}
            </label>
            <input
              id={`${id}-${field}`}
              type="date"
              value={field === 'from' ? from : to}
              onChange={(event) =>
                onChange({ from, to, [field]: event.target.value } as { from: string; to: string })
              }
              aria-invalid={invalid}
              aria-describedby={invalid ? `${id}-range-error` : undefined}
              className="h-11 w-full rounded-full border border-transparent bg-tf-field px-4 text-[13px] text-white outline-none [color-scheme:dark] focus-visible:border-tf-lime/70 aria-invalid:border-[#f97066]"
            />
          </div>
        ))}
      </div>
      {invalid && (
        <p id={`${id}-range-error`} role="alert" className="mt-2 text-[12px] text-[#f97066]">
          End date must be on or after start date.
        </p>
      )}
    </fieldset>
  )
}
