import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useAppSelector } from '@/app/store'
import { errorMessage } from '@/lib/api/base-api'
import { cn } from '@/lib/utils'
import { useSignInMutation } from './auth-api'
import { AuthShell, FieldError } from './auth-shell'
import { authButtonClass, authFieldClass, authLinkClass } from './auth-styles'
import { returnPath } from './return-path'
import { emailField } from './validation'

const schema = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignedIn = useAppSelector((state) => Boolean(state.auth.session))
  const [signIn, { isLoading }] = useSignInMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  if (isSignedIn) return <Navigate to={returnPath(location)} replace />

  const onSubmit = handleSubmit(async (values) => {
    try {
      const challenge = await signIn(values).unwrap()
      navigate('/sign-in/verify', { state: { challenge, from: location.state?.from } })
    } catch (cause) {
      toast.error(errorMessage(cause, 'Unable to sign in. Please try again.'))
    }
  })

  return (
    <AuthShell title="Admin sign in" description="Enter your credentials to continue.">
      <form noValidate onSubmit={onSubmit} className="mt-9 flex flex-col">
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

        <div className="mt-6 flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-white">
            Password
          </Label>
          <Link to="/forgot-password" className={authLinkClass}>
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          containerClassName="mt-4"
          className={authFieldClass}
          {...register('password')}
        />
        <FieldError id="password-error" message={errors.password?.message} />

        <Button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
