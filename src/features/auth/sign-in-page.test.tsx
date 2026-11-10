import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import { API_BASE_URL } from '@/lib/api/base-api'
import { renderApp } from '@/test/render-app'
import { server } from '@/test/server'

const overviewHeading = /^Good (morning|afternoon|evening), Test$/
const AUTH = `${API_BASE_URL}/backoffice/auth`

it('redirects signed-out visitors to the sign-in page', async () => {
  renderApp('/', { signedIn: false })
  expect(await screen.findByRole('heading', { name: 'Admin sign in' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
    'href',
    '/forgot-password',
  )
})

it('validates the fields before submitting', async () => {
  const { user } = renderApp('/sign-in', { signedIn: false })
  await user.click(await screen.findByRole('button', { name: 'Sign in' }))
  expect(await screen.findByText('Enter your email address')).toBeInTheDocument()
  expect(screen.getByText('Enter your password')).toBeInTheDocument()

  await user.type(screen.getByLabelText('Email address'), 'not-an-email')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
})

it('signs in with password and emailed code, then loads the profile', async () => {
  const bodies: unknown[] = []
  server.use(
    http.post(`${AUTH}/login`, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({
        status: 'success',
        data: { id: 'admin-test', email: 'admin@example.com', first_name: 'Test' },
      })
    }),
    http.post(`${AUTH}/login/verify`, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({
        status: 'success',
        data: {
          id: 'admin-test',
          email: 'admin@example.com',
          first_name: 'Test',
          last_name: 'Admin',
          jwt_token: 'jwt-123',
        },
      })
    }),
  )
  const { store, user } = renderApp('/', { signedIn: false })
  await user.type(await screen.findByLabelText('Email address'), 'admin@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret123')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
  await user.type(screen.getByLabelText('Verification code'), '123456')

  expect(await screen.findByRole('heading', { name: overviewHeading })).toBeInTheDocument()
  expect(bodies).toEqual([
    { email: 'admin@example.com', password: 'secret123' },
    { id: 'admin-test', otp: '123456' },
  ])
  expect(store.getState().auth.session?.token).toBe('jwt-123')
  // `/auth/me` fills in the role and permissions.
  await screen.findByText('Super Admin')
  expect(store.getState().auth.session?.user.permissions).toContain('staff:view')
})

it('shows the error when the code is wrong', async () => {
  server.use(
    http.post(`${AUTH}/login`, () =>
      HttpResponse.json({
        status: 'success',
        data: { id: 'admin-test', email: 'admin@example.com', first_name: 'Test' },
      }),
    ),
    http.post(`${AUTH}/login/verify`, () =>
      HttpResponse.json({ message: 'Verification Failed (try again)' }, { status: 400 }),
    ),
  )
  const { store, user } = renderApp('/sign-in', { signedIn: false })
  await user.type(await screen.findByLabelText('Email address'), 'admin@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret123')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  await user.type(await screen.findByLabelText('Verification code'), '000000')
  expect(await screen.findByRole('alert')).toHaveTextContent('Verification Failed (try again)')
  expect(store.getState().auth.session).toBeNull()
})

it('stays on the sign-in page when the password is rejected', async () => {
  server.use(
    http.post(`${AUTH}/login`, () =>
      HttpResponse.json({ message: 'Login Failed (invalid credentials)' }, { status: 400 }),
    ),
  )
  const { store, user } = renderApp('/sign-in', { signedIn: false })
  await user.type(await screen.findByLabelText('Email address'), 'admin@example.com')
  await user.type(screen.getByLabelText('Password'), 'wrong')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('heading', { name: 'Admin sign in' })).toBeInTheDocument()
  expect(store.getState().auth.session).toBeNull()
})

it('sends signed-in admins away from the sign-in page', async () => {
  renderApp('/sign-in')
  expect(await screen.findByRole('heading', { name: overviewHeading })).toBeInTheDocument()
})

it('resets a forgotten password', async () => {
  const bodies: unknown[] = []
  const record =
    (data: unknown) =>
    async ({ request }: { request: Request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ status: 'success', data })
    }
  server.use(
    http.post(`${AUTH}/forgot-password`, record({ email: 'admin@example.com' })),
    http.post(`${AUTH}/forgot-password/verify`, record({ hash_id_key: 'reset-key' })),
    http.patch(`${AUTH}/forgot-password/reset`, record(undefined)),
  )
  const { user } = renderApp('/forgot-password', { signedIn: false })
  await user.type(await screen.findByLabelText('Email address'), 'admin@example.com')
  await user.click(screen.getByRole('button', { name: 'Send reset code' }))
  await user.type(await screen.findByLabelText('Verification code'), '654321')
  await user.type(await screen.findByLabelText('New password'), 'weak')
  await user.type(screen.getByLabelText('Confirm new password'), 'weak')
  await user.click(screen.getByRole('button', { name: 'Reset password' }))
  expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument()

  await user.clear(screen.getByLabelText('New password'))
  await user.type(screen.getByLabelText('New password'), 'Newpass12')
  await user.clear(screen.getByLabelText('Confirm new password'))
  await user.type(screen.getByLabelText('Confirm new password'), 'Newpass12')
  await user.click(screen.getByRole('button', { name: 'Reset password' }))
  expect(await screen.findByRole('heading', { name: 'Password updated' })).toBeInTheDocument()
  expect(bodies).toEqual([
    { email: 'admin@example.com' },
    { email: 'admin@example.com', otp: '654321' },
    { hash_id_key: 'reset-key', new_password: 'Newpass12', confirm_new_password: 'Newpass12' },
  ])
})

it('accepts a staff invitation', async () => {
  let body: unknown
  server.use(
    http.post(`${API_BASE_URL}/backoffice/staff/invite/accept`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ status: 'success' })
    }),
  )
  const { user } = renderApp('/accept-invite?token=abc123', { signedIn: false })
  await user.type(await screen.findByLabelText('New password'), 'Welcome12')
  await user.type(screen.getByLabelText('Confirm new password'), 'Welcome12')
  await user.click(screen.getByRole('button', { name: 'Activate account' }))
  expect(await screen.findByRole('heading', { name: 'You’re all set' })).toBeInTheDocument()
  expect(body).toEqual({
    token: 'abc123',
    new_password: 'Welcome12',
    confirm_new_password: 'Welcome12',
  })
})

it('shows and hides the password with the eye button', async () => {
  const { user } = renderApp('/sign-in', { signedIn: false })
  const password = await screen.findByLabelText('Password')
  await user.type(password, 'secret123')
  expect(password).toHaveAttribute('type', 'password')
  await user.click(screen.getByRole('button', { name: 'Show password' }))
  expect(password).toHaveAttribute('type', 'text')
  expect(password).toHaveValue('secret123')
  await user.click(screen.getByRole('button', { name: 'Hide password' }))
  expect(password).toHaveAttribute('type', 'password')
})

it('has a show / hide toggle on both new-password fields', async () => {
  const { user } = renderApp('/accept-invite?token=abc123', { signedIn: false })
  const fresh = await screen.findByLabelText('New password')
  const confirm = screen.getByLabelText('Confirm new password')
  const [first, second] = screen.getAllByRole('button', { name: 'Show password' })
  await user.click(first!)
  expect(fresh).toHaveAttribute('type', 'text')
  expect(confirm).toHaveAttribute('type', 'password')
  await user.click(second!)
  expect(confirm).toHaveAttribute('type', 'text')
})
