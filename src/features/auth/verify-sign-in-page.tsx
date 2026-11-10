import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { signedIn } from '@/app/session-slice'
import { errorMessage } from '@/lib/api/base-api'
import {
  useResendSignInCodeMutation,
  useVerifySignInCodeMutation,
  type SignInChallenge,
} from './auth-api'
import { AuthShell, FieldError } from './auth-shell'
import { authButtonClass, authLinkClass } from './auth-styles'
import { CodeInput } from './code-input'
import { returnPath } from './return-path'
import { useCooldown } from './use-cooldown'

/** Step 2 of sign-in: the 6-digit code emailed after the password was accepted. */
export function VerifySignInPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const challenge = (location.state as { challenge?: SignInChallenge } | null)?.challenge
  const isSignedIn = useAppSelector((state) => Boolean(state.auth.session))
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [verify, { isLoading }] = useVerifySignInCodeMutation()
  const [resend, { isLoading: resending }] = useResendSignInCodeMutation()
  const cooldown = useCooldown()

  if (isSignedIn) return <Navigate to={returnPath(location)} replace />
  if (!challenge) return <Navigate to="/sign-in" replace />

  async function submit(value = code) {
    if (value.length !== 6) return setError('Enter the 6-digit code from your email')
    setError('')
    try {
      const session = await verify({ id: challenge!.id, otp: value }).unwrap()
      dispatch(signedIn(session))
      navigate(returnPath(location), { replace: true })
    } catch (cause) {
      setCode('')
      setError(errorMessage(cause, 'That code did not work. Try again.'))
    }
  }

  async function resendCode() {
    try {
      await resend({ id: challenge!.id }).unwrap()
      cooldown.restart()
      setCode('')
      setError('')
      toast.success('A new code has been sent to your email')
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }

  return (
    <AuthShell
      title="Check your email"
      description={
        <>
          We sent a 6-digit code to <span className="text-white">{challenge.email}</span>. It
          expires in 10 minutes.
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
          {isLoading ? 'Verifying…' : 'Verify and sign in'}
        </Button>
        <p className="mt-6 text-center text-[14px] text-[#a3a8b2]">
          Didn’t get it?{' '}
          {cooldown.left > 0 ? (
            <span>Resend in {cooldown.left}s</span>
          ) : (
            <button
              type="button"
              onClick={resendCode}
              disabled={resending}
              className="font-medium text-[#d9ef00] hover:underline"
            >
              Resend code
            </button>
          )}
        </p>
        <Link to="/sign-in" className={`${authLinkClass} mt-4 self-center`}>
          Use a different account
        </Link>
      </form>
    </AuthShell>
  )
}
