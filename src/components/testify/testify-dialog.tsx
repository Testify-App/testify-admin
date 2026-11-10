import type { ReactNode } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonClass } from './button-class'

function DialogFrame({
  open,
  onOpenChange,
  className,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#05080c]/70 backdrop-blur-[6px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[695px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[24px] border border-[#3f454f] bg-tf-panel px-5 pt-16 pb-6 font-dm-sans text-white outline-none sm:min-h-[741px] sm:px-8 sm:pb-[31px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            className,
          )}
        >
          {children}
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-[33px] right-[33px] grid size-7 place-items-center rounded-full text-white hover:bg-white/10"
          >
            <X className="size-6" strokeWidth={2} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Lime disc inside a faint lime ring, used at the top of every Testify dialog. */
export function DialogIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="mx-auto grid size-[146px] shrink-0 place-items-center rounded-full border-[3px] border-tf-lime/30"
    >
      <span className="grid size-[120px] place-items-center rounded-full bg-tf-lime text-tf-page [&_svg]:size-[52px]">
        {children}
      </span>
    </span>
  )
}

function DialogHeading({ title, description }: { title: ReactNode; description: ReactNode }) {
  return (
    <>
      <DialogPrimitive.Title className="mt-[21px] text-center text-[24px] leading-8 font-semibold">
        {title}
      </DialogPrimitive.Title>
      <DialogPrimitive.Description className="mt-[21px] text-center text-[18px] leading-6 text-tf-periwinkle">
        {description}
      </DialogPrimitive.Description>
    </>
  )
}

/** Confirmation dialog: icon, title, description, optional preview and Cancel / confirm buttons. */
export function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  busy = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon: ReactNode
  title: ReactNode
  description: ReactNode
  children?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  busy?: boolean
}) {
  return (
    <DialogFrame open={open} onOpenChange={onOpenChange} className="sm:pt-[95px]">
      <DialogIcon>{icon}</DialogIcon>
      <DialogHeading title={title} description={description} />
      {children && <div className="mt-[33px]">{children}</div>}
      <div className="mt-10 grid grid-cols-2 gap-4 sm:mt-auto sm:pt-10">
        <DialogPrimitive.Close className={cn(buttonClass.muted, 'h-[68px]')}>
          Cancel
        </DialogPrimitive.Close>
        <button
          type="button"
          className={cn(buttonClass.primary, 'h-[68px]')}
          disabled={busy}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </DialogFrame>
  )
}

/** Centered success state with a single Done button. */
export function SuccessDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon: ReactNode
  title: ReactNode
  description: ReactNode
  onDone: () => void
}) {
  return (
    <DialogFrame open={open} onOpenChange={onOpenChange} className="justify-center sm:pt-0">
      <DialogIcon>{icon}</DialogIcon>
      <DialogHeading title={title} description={description} />
      <button
        type="button"
        className={cn(buttonClass.primary, 'mx-auto mt-20 h-[68px] w-full max-w-[304px]')}
        onClick={onDone}
      >
        Done
      </button>
    </DialogFrame>
  )
}

/** Content preview shown inside the restore dialogs. */
export function ContentPreview({
  image,
  imageShape = 'square',
  text,
  meta,
}: {
  /** Omitted for text-only content. */
  image?: string
  imageShape?: 'square' | 'circle'
  text: string
  meta: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-[16px] bg-tf-quote px-6 py-6">
      {image && (
        <img
          src={image}
          alt=""
          className={cn(
            'size-[61px] shrink-0 object-cover',
            imageShape === 'circle' ? 'rounded-full' : 'rounded-[8px]',
          )}
        />
      )}
      <div className="min-w-0">
        <p className="text-[15px] leading-5 font-medium">{text}</p>
        <p className="mt-[10px] text-[12px] leading-4 text-tf-grey">{meta}</p>
      </div>
    </div>
  )
}
