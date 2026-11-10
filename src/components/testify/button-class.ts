import { cn } from '@/lib/utils'

const buttonBase =
  'inline-flex h-[57px] items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50'

/** Lime primary and outlined secondary pill buttons. */
export const buttonClass = {
  primary: cn(buttonBase, 'bg-tf-lime text-tf-page hover:bg-[#c8dc00]'),
  outline: cn(buttonBase, 'border border-[#585d67] text-white hover:bg-white/5'),
  muted: cn(buttonBase, 'bg-[#29303b] text-tf-grey hover:bg-[#323a47]'),
  danger: cn(buttonBase, 'bg-tf-red text-white hover:bg-[#d63a2d]'),
}
