import type { ComponentProps } from 'react'
import { DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/** Shared Tailwind styling for dialogs within the administration workspace. */
export function AdminDialogContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      {...props}
      className={cn(
        '[--background:#fff] bg-white text-[#101828] font-inter [&_[data-slot=dialog-title]]:font-heading [&_[data-slot=dialog-title]]:text-lg [&_[data-slot=dialog-title]]:leading-[1.4] [&_[data-slot=dialog-description]]:text-[13px] [&_[data-slot=dialog-description]]:leading-normal [&_[data-slot=dialog-description]]:text-[#667085]',
        className,
      )}
    />
  )
}
