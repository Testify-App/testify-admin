import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/api/base-api'
import { cn } from '@/lib/utils'
import { useAcceptInviteMutation } from './auth-api'
import { AuthShell } from './auth-shell'
import { authButtonClass } from './auth-styles'
import { NewPasswordForm } from './new-password-form'

/** Landing page for the staff invitation email: the invitee sets a password. */
export function AcceptInvitePage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [accept, { isLoading }] = useAcceptInviteMutation()
  const [accepted, setAccepted] = useState(false)

  const signInLink = (
    <Link to="/sign-in" className={cn(authButtonClass, 'flex items-center justify-center')}>
      Go to sign in
    </Link>
  )

  if (!token)
    return (
      <AuthShell
        title="Invitation link incomplete"
        description="Open the link from your invitation email again, or ask your administrator to resend it."
      >
        {signInLink}
      </AuthShell>
    )
  if (accepted)
    return (
      <AuthShell
        title="You’re all set"
        description="Your account is active. Sign in with your email address and new password."
      >
        {signInLink}
      </AuthShell>
    )
  return (
    <AuthShell
      title="Accept your invitation"
      description="Create a password to activate your Testify admin account."
    >
      <NewPasswordForm
        submitLabel="Activate account"
        busy={isLoading}
        onSubmit={async (values) => {
          try {
            await accept({
              token,
              new_password: values.password,
              confirm_new_password: values.confirm,
            }).unwrap()
            setAccepted(true)
          } catch (cause) {
            toast.error(errorMessage(cause))
          }
        }}
      />
    </AuthShell>
  )
}
