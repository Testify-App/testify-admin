import { cn } from '@/lib/utils'

export const authFieldClass =
  'h-14 rounded-full border-transparent bg-[#222834] px-4 text-base text-white shadow-none placeholder:text-[#8b909a] md:text-base dark:bg-[#222834] focus-visible:border-[#d9ef00] focus-visible:ring-[#d9ef00]/25 aria-invalid:border-[#f97066] aria-invalid:ring-[#f97066]/20'

export const authButtonClass =
  'mt-8 h-14 rounded-full bg-[#d9ef00] text-base font-semibold text-[#0b0f14] hover:bg-[#d9ef00]/90 focus-visible:ring-[#d9ef00]/40'

export const authLinkClass =
  'text-[13px] text-[#c9ccd2] underline-offset-4 hover:text-white hover:underline'

/** Six-digit code boxes in the sign-in field style. */
export function codeSlotClass(invalid: boolean) {
  return cn(
    'h-14 w-12 rounded-[14px] border border-transparent bg-[#222834] text-xl font-semibold text-white first:rounded-l-[14px] first:border last:rounded-r-[14px] data-[active=true]:border-[#d9ef00] data-[active=true]:ring-[#d9ef00]/25 sm:w-14',
    invalid && 'border-[#f97066]',
  )
}
