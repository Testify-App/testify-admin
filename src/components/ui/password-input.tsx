import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'

/**
 * Password field with a show / hide toggle. Takes the same props as `Input` (including the
 * `ref` and handlers from react-hook-form's `register`); `containerClassName` styles the wrapper,
 * e.g. for spacing.
 */
export function PasswordInput({
  className,
  containerClassName,
  ...props
}: Omit<ComponentProps<typeof Input>, 'type'> & { containerClassName?: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={cn('relative', containerClassName)}>
      <Input {...props} type={visible ? 'text' : 'password'} className={cn(className, 'pr-14')} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={props.id}
        disabled={props.disabled}
        className="absolute top-1/2 right-4 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#8b909a] transition-colors outline-none hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#d9ef00]/60 disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="size-5" aria-hidden />
        ) : (
          <Eye className="size-5" aria-hidden />
        )}
      </button>
    </div>
  )
}
