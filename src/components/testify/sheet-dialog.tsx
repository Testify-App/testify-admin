import type { ReactNode } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonClass } from './button-class'

/** Right-hand form sheet: title band, scrolling body and a sticky action footer. */
export function SheetDialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#05080c]/70 backdrop-blur-[6px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-3 right-3 z-50 flex w-[calc(100%-1.5rem)] max-w-[560px] flex-col overflow-hidden rounded-[24px] border border-[#3f454f] bg-tf-panel font-dm-sans text-white outline-none sm:inset-y-6 sm:right-6 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-10 data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-right-10 data-[state=open]:fade-in-0',
            className,
          )}
        >
          <div className="shrink-0 border-b border-tf-line px-6 pt-7 pr-16 pb-6 sm:px-8 sm:pr-16">
            <DialogPrimitive.Title className="text-[24px] leading-8 font-semibold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-[15px] leading-6 text-tf-periwinkle">
              {description}
            </DialogPrimitive.Description>
          </div>
          {children}
          <DialogPrimitive.Close
            aria-label={`Close ${typeof title === 'string' ? title : 'dialog'}`}
            className="absolute top-7 right-6 grid size-8 place-items-center rounded-full text-white hover:bg-white/10"
          >
            <X className="size-6" strokeWidth={2} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Scrolling body of a sheet. */
export function SheetBody({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8', className)}>
      {children}
    </div>
  )
}

/** Cancel / submit footer; the submit button submits the enclosing form. */
export function SheetFooter({
  onCancel,
  submitLabel,
  cancelLabel = 'Cancel',
  disabled = false,
  destructive = false,
  className,
}: {
  onCancel: () => void
  submitLabel: string
  cancelLabel?: string
  disabled?: boolean
  destructive?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid shrink-0 grid-cols-2 gap-4 border-t border-tf-line px-6 py-5 sm:px-8',
        className,
      )}
    >
      <button type="button" className={buttonClass.muted} onClick={onCancel}>
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={disabled}
        className={destructive ? buttonClass.danger : buttonClass.primary}
      >
        {submitLabel}
      </button>
    </div>
  )
}
