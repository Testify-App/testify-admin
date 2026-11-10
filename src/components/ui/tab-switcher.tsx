import type { ReactNode } from 'react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type TabSwitcherItem =
  | string
  | {
      value: string
      label: ReactNode
      ariaLabel?: string
      disabled?: boolean
    }

/** Shared Role Details appearance; selection and panels are managed by the enclosing Tabs. */
export function TabSwitcher({
  items,
  className,
  ariaLabel,
}: {
  items: TabSwitcherItem[]
  className?: string
  ariaLabel?: string
}) {
  return (
    <div className={cn('min-w-0 max-w-full overflow-x-auto', className)}>
      <TabsList
        aria-label={ariaLabel}
        className="h-11 w-full min-w-max justify-start gap-2.5 rounded-none border-b border-[#eeeef1] bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-11 sm:gap-6 [&_[data-slot=tabs-trigger]]:h-full [&_[data-slot=tabs-trigger]]:flex-none [&_[data-slot=tabs-trigger]]:rounded-none [&_[data-slot=tabs-trigger]]:border-0 [&_[data-slot=tabs-trigger]]:bg-transparent [&_[data-slot=tabs-trigger]]:px-2 [&_[data-slot=tabs-trigger]]:py-3 [&_[data-slot=tabs-trigger]]:shadow-none [&_[data-slot=tabs-trigger]]:after:hidden [&_[data-state=active]]:border-b-2 [&_[data-state=active]]:border-primary [&_[data-state=active]]:bg-[#eff8ff] [&_[data-state=active]]:text-primary"
      >
        {items.map((item) => {
          const tab = typeof item === 'string' ? { value: item, label: item } : item
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              aria-label={tab.ariaLabel}
              disabled={tab.disabled}
            >
              {tab.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </div>
  )
}
