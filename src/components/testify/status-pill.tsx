import { cn } from '@/lib/utils'

export type PillTone =
  'pending' | 'review' | 'active' | 'published' | 'removed' | 'warning' | 'neutral' | 'hidden'

const tones: Record<PillTone, string> = {
  pending: 'bg-[#2d2b18] text-tf-gold',
  review: 'bg-[#0e1931] text-tf-blue',
  active: 'bg-[#0e2d20] text-tf-green',
  published: 'bg-[#0d211b] text-tf-green',
  removed: 'bg-[#2c222e] text-[#f04438]',
  warning: 'bg-[#31332d] text-tf-gold',
  neutral: 'bg-tf-field text-tf-silver',
  hidden: 'bg-[#1b2116] text-[#bdd000]',
}

/** Rounded status label used across tables, cards and profile headers. */
export function StatusPill({
  tone,
  children,
  dot = false,
  className,
}: {
  tone: PillTone
  children: React.ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center gap-[6px] rounded-full px-4 text-[12px] font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-[5px] rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

/** Fixed-width status chip used in the report and user tables. */
export function TableStatus({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <StatusPill tone={tone} className="h-9 w-[110px] rounded-[10px] px-2 text-[12px]">
      {children}
    </StatusPill>
  )
}
