import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { cn, initials } from '@/lib/utils'

/** Large page container (the #0f1623 surface every screen sits on). */
export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('rounded-[20px] bg-tf-panel', className)} {...props} />
}

/** Bordered inner card used on report and profile screens. */
export function InfoCard({
  title,
  action,
  className,
  children,
  ...props
}: Omit<ComponentProps<'section'>, 'title'> & { title?: ReactNode; action?: ReactNode }) {
  return (
    <section
      className={cn('rounded-[20px] border border-tf-line bg-tf-card p-5 sm:p-[31px]', className)}
      {...props}
    >
      {(title || action) && (
        <div className="flex min-h-8 items-center justify-between gap-4">
          {title && <h2 className="text-[20px] leading-7 font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Label / value row with the value right-aligned (account overview lists). */
export function DetailRow({
  label,
  children,
  className,
  style,
}: {
  label: ReactNode
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={cn('flex items-center justify-between gap-4 text-[14px] leading-5', className)}
      style={style}
    >
      <dt className="text-tf-muted">{label}</dt>
      <dd className="text-right text-white">{children}</dd>
    </div>
  )
}

/** Gold initials avatar used for reporters and content owners. */
export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-[46px] shrink-0 place-items-center rounded-full bg-tf-gold text-[16px] font-semibold text-black',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
