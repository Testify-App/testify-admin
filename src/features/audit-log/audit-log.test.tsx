import { screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'

it('shows moderation actions by default and admin events on request', async () => {
  const { user } = renderApp('/audit-log')
  const table = await screen.findByRole('table')
  expect(await within(table).findByText('User banned')).toBeInTheDocument()
  expect(within(table).getByRole('link', { name: '@adaobi' })).toHaveAttribute(
    'href',
    '/users/u-ada',
  )
  expect(within(table).queryByText('Signed in')).not.toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('Filter by category'), 'admin')
  await waitFor(() => expect(within(table).getByText('Signed in')).toBeInTheDocument())
  expect(within(table).queryByText('User banned')).not.toBeInTheDocument()
})
