import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { FieldError } from './auth-shell'
import { authButtonClass, authFieldClass } from './auth-styles'
import { newPasswordForm, type NewPasswordValues } from './validation'

/** New password + confirmation, used by password reset and invitation acceptance. */
export function NewPasswordForm({
  submitLabel,
  busy,
  onSubmit,
}: {
  submitLabel: string
  busy: boolean
  onSubmit: (values: NewPasswordValues) => void | Promise<void>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordForm),
    defaultValues: { password: '', confirm: '' },
  })
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-9 flex flex-col">
      <Label htmlFor="new-password" className="text-sm font-medium text-white">
        New password
      </Label>
      <PasswordInput
        id="new-password"
        autoComplete="new-password"
        placeholder="Enter a new password"
        aria-invalid={Boolean(errors.password)}
        aria-describedby="password-hint"
        containerClassName="mt-4"
        className={authFieldClass}
        {...register('password')}
      />
      {errors.password ? (
        <FieldError id="password-hint" message={errors.password.message} />
      ) : (
        <p id="password-hint" className="mt-2 pl-4 text-[13px] text-[#8b909a]">
          At least 8 characters, with an uppercase letter and a number.
        </p>
      )}
      <Label htmlFor="confirm-password" className="mt-6 text-sm font-medium text-white">
        Confirm new password
      </Label>
      <PasswordInput
        id="confirm-password"
        autoComplete="new-password"
        placeholder="Re-enter the new password"
        aria-invalid={Boolean(errors.confirm)}
        aria-describedby={errors.confirm ? 'confirm-error' : undefined}
        containerClassName="mt-4"
        className={authFieldClass}
        {...register('confirm')}
      />
      <FieldError id="confirm-error" message={errors.confirm?.message} />
      <Button type="submit" disabled={busy} className={authButtonClass}>
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
