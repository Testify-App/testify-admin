import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/lib/api/base-api'
import { cn } from '@/lib/utils'
import {
  useRequestPasswordResetMutation,
  useResendPasswordResetMutation,
  useResetPasswordMutation,
  useVerifyPasswordResetMutation,
} from './auth-api'
import { AuthShell, FieldError } from './auth-shell'
import { authButtonClass, authFieldClass, authLinkClass } from './auth-styles'
import { CodeInput } from './code-input'
import { NewPasswordForm } from './new-password-form'
import { useCooldown } from './use-cooldown'
import { emailField } from './validation'

type Step =
  | { name: 'email' }
  | { name: 'code'; email: string }
  | { name: 'password'; key: string }
  | { name: 'done' }

const backToSignIn = (
  <Link to="/sign-in" className={cn(authLinkClass, 'mt-6 self-center')}>
    Back to sign in
  </Link>
)

/** Email → 6-digit code → new password. */
export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>({ name: 'email' })
  const [resetPassword, { isLoading: saving }] = useResetPasswordMutation()

  if (step.name === 'email')
    return <EmailStep onSent={(email) => setStep({ name: 'code', email })} />
  if (step.name === 'code')
    return <CodeStep email={step.email} onVerified={(key) => setStep({ name: 'password', key })} />
  if (step.name === 'password')
    return (
      <AuthShell
        title="Choose a new password"
        description="You’ll use it the next time you sign in."
      >
        <NewPasswordForm
          submitLabel="Reset password"
          busy={saving}
          onSubmit={async (values) => {
            try {
              await resetPassword({
                hash_id_key: step.key,
                new_password: values.password,
                confirm_new_password: values.confirm,
              }).unwrap()
              setStep({ name: 'done' })
            } catch (cause) {
              toast.error(errorMessage(cause))
            }
          }}
        />
      </AuthShell>
    )
  return (
    <AuthShell
      title="Password updated"
      description="Your password has been reset. Sign in with your new password."
    >
      <Link to="/sign-in" className={cn(authButtonClass, 'flex items-center justify-center')}>
        Go to sign in
      </Link>
    </AuthShell>
  )
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [request, { isLoading }] = useRequestPasswordResetMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: emailField })),
    defaultValues: { email: '' },
  })
  return (
    <AuthShell
      title="Forgot password"
      description="Enter the email address you use to sign in and we’ll send you a reset code."
    >
      <form
        noValidate
        className="mt-9 flex flex-col"
        onSubmit={handleSubmit(async ({ email }) => {
          try {
            await request({ email }).unwrap()
            onSent(email)
          } catch (cause) {
            toast.error(errorMessage(cause))
          }
        })}
      >
        <Label htmlFor="email" className="text-sm font-medium text-white">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={cn(authFieldClass, 'mt-4')}
          {...register('email')}
        />
        <FieldError id="email-error" message={errors.email?.message} />
        <Button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? 'Sending…' : 'Send reset code'}
        </Button>
        {backToSignIn}
      </form>
    </AuthShell>
  )
}

function CodeStep({ email, onVerified }: { email: string; onVerified: (key: string) => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [verify, { isLoading }] = useVerifyPasswordResetMutation()
  const [resend, { isLoading: resending }] = useResendPasswordResetMutation()
  const cooldown = useCooldown()

  async function submit(value = code) {
    if (value.length !== 6) return setError('Enter the 6-digit code from your email')
    try {
      onVerified(await verify({ email, otp: value }).unwrap())
    } catch (cause) {
      setCode('')
      setError(errorMessage(cause, 'That code did not work. Try again.'))
    }
  }

  return (
    <AuthShell
      title="Enter reset code"
      description={
        <>
          We sent a 6-digit code to <span className="text-white">{email}</span>.
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <CodeInput
          value={code}
          onChange={(value) => {
            setCode(value)
            setError('')
          }}
          onComplete={(value) => void submit(value)}
          invalid={!!error}
          disabled={isLoading}
        />
        <div className="text-center">
          <FieldError id="code-error" message={error} />
        </div>
        <Button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? 'Verifying…' : 'Continue'}
        </Button>
        <p className="mt-6 text-center text-[14px] text-[#a3a8b2]">
          Didn’t get it?{' '}
          {cooldown.left > 0 ? (
            <span>Resend in {cooldown.left}s</span>
          ) : (
            <button
              type="button"
              disabled={resending}
              className="font-medium text-[#d9ef00] hover:underline"
              onClick={async () => {
                try {
                  await resend({ email }).unwrap()
                  cooldown.restart()
                  toast.success('A new code has been sent to your email')
                } catch (cause) {
                  toast.error(errorMessage(cause))
                }
              }}
            >
              Resend code
            </button>
          )}
        </p>
        {backToSignIn}
      </form>
    </AuthShell>
  )
}
