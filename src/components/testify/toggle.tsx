import { Switch as SwitchPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/** Lime on/off switch from the Settings design. */
export function Toggle({ className, ...props }: SwitchPrimitive.SwitchProps) {
  return (
    <SwitchPrimitive.Root
      {...props}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full bg-[#303540] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-tf-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-tf-panel disabled:cursor-not-allowed data-[state=checked]:bg-tf-lime data-[disabled]:opacity-70',
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="block size-[18px] translate-x-[3px] rounded-full bg-[#50555e] transition-transform data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-tf-panel" />
    </SwitchPrimitive.Root>
  )
}
