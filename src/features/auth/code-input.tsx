import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { codeSlotClass } from './auth-styles'

/** Six-digit verification code. Calls `onComplete` once every digit is filled. */
export function CodeInput({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  invalid?: boolean
  disabled?: boolean
}) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      inputMode="numeric"
      pattern="^[0-9]*$"
      autoFocus
      aria-label="Verification code"
      aria-invalid={invalid}
      containerClassName="mt-8 justify-center"
    >
      <InputOTPGroup className="gap-2 sm:gap-3">
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot key={index} index={index} className={codeSlotClass(!!invalid)} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
