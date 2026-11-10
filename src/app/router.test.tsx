import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'

it('renders the overview inside the admin layout', async () => {
  renderApp('/')
  expect(
    await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening), Test$/ }),
  ).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  expect(screen.getAllByText('Test Admin').length).toBeGreaterThan(0)
})

it('shows a not-found page for unknown routes', async () => {
  renderApp('/nowhere')
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})

it('logging out clears the session', async () => {
  const { store, user } = renderApp('/')
  await user.click((await screen.findAllByRole('button', { name: 'Log Out' }))[0])
  expect(store.getState().auth.session).toBeNull()
})
