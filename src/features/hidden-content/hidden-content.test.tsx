import { screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'
import { moderationState } from '@/test/moderation-mock'

it('lists hidden posts and restores one after confirming', async () => {
  const { user } = renderApp('/hidden-content')
  expect(await screen.findByText('An older testimony that was removed')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /Hidden Posts \(1\)/ })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Restore Post' }))
  const dialog = await screen.findByRole('dialog', { name: 'Restore Post?' })
  await user.click(within(dialog).getByRole('button', { name: 'Restore Post' }))
  await waitFor(() =>
    expect(moderationState().content.find((c) => c.id === 'post-old')!.hidden_at).toBeNull(),
  )
  expect(
    await screen.findByText('No hidden posts. Everything has been reviewed.'),
  ).toBeInTheDocument()
})

it('hides restore from admins without hidden:update', async () => {
  renderApp('/hidden-content', {
    session: {
      token: 't',
      user: { id: 'viewer', name: 'Viewer', email: 'v@testify.app', permissions: ['hidden:view'] },
    },
  })
  expect(await screen.findByText('An older testimony that was removed')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Restore Post' })).not.toBeInTheDocument()
})
