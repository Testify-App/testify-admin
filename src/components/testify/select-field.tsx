import type { ComponentProps } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Option {
  value: string
  label: string
}

const sizes = {
  /** 56px filters and form selects. */
  lg: 'h-14 pl-6 pr-14 text-[15px]',
  /** 46px compact filters (audit log). */
  sm: 'h-[46px] pl-6 pr-12 text-[14px]',
}

/**
 * Native select dressed as the design's pill dropdown. The empty value is the “all” option and is
 * shown in the muted placeholder colour.
 */
export function SelectField({
  options,
  value,
  onValueChange,
  size = 'lg',
  placeholderClassName = 'text-tf-faint',
  className,
  ...props
}: Omit<ComponentProps<'select'>, 'size' | 'onChange' | 'value'> & {
  options: Option[]
  value: string
  onValueChange: (value: string) => void
  size?: keyof typeof sizes
  placeholderClassName?: string
}) {
  const isPlaceholder = options[0]?.value === value && value === ''
  return (
    <div className={cn('relative', className)}>
      <select
        {...props}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          'w-full cursor-pointer appearance-none truncate rounded-full border border-transparent bg-tf-field outline-none focus-visible:border-tf-lime/70 aria-invalid:border-[#f97066]',
          sizes[size],
          isPlaceholder ? placeholderClassName : 'text-white',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-tf-card text-white">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 text-[#f2f2f2]',
          size === 'lg' ? 'right-[26px]' : 'right-[22px]',
        )}
        strokeWidth={2.25}
      />
    </div>
  )
}
