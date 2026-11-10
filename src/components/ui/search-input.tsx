import { useRef, type ComponentProps, type ReactNode, type Ref } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'ref'> & {
  value: string
  onValueChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
  /** Leading icon, rendered before the input inside the wrapper. */
  icon?: ReactNode
  /** Shown at the end of the field while it is empty (e.g. a keyboard shortcut hint). */
  hint?: ReactNode
  /** Classes for the wrapper; style the input through `inputClassName` or wrapper selectors. */
  className?: string
  inputClassName?: string
}

/** Search field with an accessible clear (×) button that empties it and returns focus. */
export function SearchInput({
  value,
  onValueChange,
  ref,
  icon,
  hint,
  className,
  inputClassName,
  ...props
}: SearchInputProps) {
  const input = useRef<HTMLInputElement | null>(null)
  const label = props['aria-label']
  return (
    <div className={cn('relative flex items-center', className)}>
      {icon}
      <Input
        {...props}
        ref={(node) => {
          input.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn('pr-9', inputClassName)}
      />
      {value ? (
        <button
          type="button"
          aria-label={label ? `Clear ${label.toLowerCase()}` : 'Clear search'}
          onClick={() => {
            onValueChange('')
            input.current?.focus()
          }}
          className="absolute right-2 flex size-6 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7] hover:text-[#344054] focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ) : (
        hint
      )}
    </div>
  )
}
