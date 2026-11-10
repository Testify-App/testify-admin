import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** The mockups use three accent treatments for the same control. */
const tones = {
  lavender: {
    current: 'bg-tf-lavender text-tf-panel',
    page: 'text-white',
    prev: 'text-tf-violet',
    next: 'text-white',
  },
  violet: {
    current: 'bg-tf-violet text-tf-panel',
    page: 'text-tf-violet',
    prev: 'text-tf-violet',
    next: 'text-tf-violet',
  },
  lime: {
    current: 'bg-tf-lime text-tf-page',
    page: 'text-tf-lime',
    prev: 'text-tf-lime',
    next: 'text-tf-lime',
  },
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  tone = 'violet',
  className,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  tone?: keyof typeof tones
  className?: string
}) {
  if (totalPages <= 1) return null
  const t = tones[tone]
  const navClass =
    'flex h-9 items-center gap-[10px] rounded-full bg-tf-field px-5 text-[11px] font-semibold disabled:cursor-default'
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-end gap-4', className)}>
      <button
        type="button"
        className={cn(navClass, t.prev)}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronsLeft className="size-4 text-white" aria-hidden />
        Previous
      </button>
      <div className="flex h-9 items-center rounded-full bg-tf-field">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            type="button"
            aria-label={`Page ${number}`}
            aria-current={number === page ? 'page' : undefined}
            onClick={() => onPageChange(number)}
            className={cn(
              'grid size-9 place-items-center rounded-full text-[11px] font-semibold',
              number === page ? t.current : t.page,
            )}
          >
            {number}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={cn(navClass, t.next)}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronsRight className="size-4 text-white" aria-hidden />
      </button>
    </nav>
  )
}
