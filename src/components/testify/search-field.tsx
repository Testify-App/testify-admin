import type { ComponentProps } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 46px pill search box on the field colour. */
export function SearchField({
  className,
  onValueChange,
  ...props
}: Omit<ComponentProps<'input'>, 'onChange'> & { onValueChange: (value: string) => void }) {
  return (
    <label
      className={cn(
        'flex h-[46px] w-full items-center gap-[10px] rounded-full bg-tf-field px-6 sm:w-[340px]',
        className,
      )}
    >
      <Search className="size-[18px] shrink-0 text-white" aria-hidden />
      <input
        type="search"
        {...props}
        onChange={(event) => onValueChange(event.target.value)}
        className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-tf-slate"
      />
    </label>
  )
}
