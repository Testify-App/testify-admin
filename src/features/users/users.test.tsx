import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'
import { moderationState } from '@/test/moderation-mock'

const john = () => moderationState().users.find((u) => u.id === 'u-john')!

describe('users list', () => {
  it('searches and shows the suspended / banned tab', async () => {
    const { user } = renderApp('/users')
    const table = await screen.findByRole('table')
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(4))
    await user.type(screen.getByLabelText('Search users'), 'grace')
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(2))

    await user.click(screen.getByRole('tab', { name: 'Suspended / Banned' }))
    const restricted = await screen.findByRole('tabpanel')
    await waitFor(() => expect(within(restricted).getByText('@adaobi')).toBeInTheDocument())
    expect(within(restricted).getByText('Permanent')).toBeInTheDocument()
    expect(within(restricted).getByText('Fraud or scams')).toBeInTheDocument()
  })
})

describe('member profile', () => {
  it('shows metadata, flagged content and notes', async () => {
    renderApp('/users/u-john')
    expect(await screen.findByRole('heading', { name: 'Member Profile' })).toBeInTheDocument()
    expect(await screen.findByText('Likes received')).toBeInTheDocument()
    const flagged = await screen.findByRole('list', { name: 'Flagged content' })
    expect(within(flagged).getAllByRole('listitem')).toHaveLength(2)
    expect(
      within(flagged).getByRole('link', { name: 'Buy cheap followers now!!!' }),
    ).toHaveAttribute('href', '/moderation?search=post-spam')
    expect(await screen.findByText('Second spam report this month')).toBeInTheDocument()
    // Another admin's note can't be edited.
    expect(screen.queryByRole('button', { name: 'Edit note' })).not.toBeInTheDocument()
  })

  it('suspends, then reinstates, recording the history', async () => {
    const { user } = renderApp('/users/u-john')
    await user.click(await screen.findByRole('button', { name: 'Suspend Account' }))
    const sheet = await screen.findByRole('dialog', { name: 'Suspend Account' })
    await user.selectOptions(within(sheet).getByLabelText('Suspend for'), '30')
    await user.type(within(sheet).getByLabelText(/Internal note/), 'Repeat spam')
    await user.click(within(sheet).getByRole('button', { name: 'Suspend' }))
    await waitFor(() => expect(john().moderation_status).toBe('suspended'))
    expect(await screen.findByRole('button', { name: 'Reinstate Account' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send Warning' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reinstate Account' }))
    const reinstate = await screen.findByRole('dialog', { name: 'Reinstate Account' })
    await user.selectOptions(within(reinstate).getByLabelText('Reason'), 'Appeal approved')
    await user.click(within(reinstate).getByRole('button', { name: 'Reinstate' }))
    await waitFor(() => expect(john().moderation_status).toBe('active'))
    expect(
      moderationState()
        .history.filter((h) => h.user_id === 'u-john')
        .map((h) => h.kind),
    ).toEqual(['reinstate', 'suspend'])
  })

  it('sends a warning from a template', async () => {
    const { user } = renderApp('/users/u-john')
    await user.click(await screen.findByRole('button', { name: 'Send Warning' }))
    const sheet = await screen.findByRole('dialog', { name: 'Send Warning' })
    await user.selectOptions(within(sheet).getByLabelText('Template'), 'spam')
    expect(within(sheet).getByLabelText('Message')).toHaveValue(
      'Please stop posting promotional content.',
    )
    await user.click(within(sheet).getByRole('button', { name: 'Send Warning' }))
    await waitFor(() =>
      expect(moderationState().history[0]).toMatchObject({ user_id: 'u-john', kind: 'warning' }),
    )
  })

  it('adds and edits an own note', async () => {
    const { user } = renderApp('/users/u-john')
    await user.type(await screen.findByLabelText('Note'), 'Check again next week')
    await user.selectOptions(screen.getByLabelText('Note tag'), 'pending_review')
    await user.click(screen.getByRole('button', { name: 'Add Note' }))
    expect(await screen.findByText('Check again next week')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit note' }))
    const field = screen.getByDisplayValue('Check again next week')
    await user.clear(field)
    await user.type(field, 'Checked, all fine')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(moderationState().notes[0]).toMatchObject({
        body: 'Checked, all fine',
        tag: 'pending_review',
      }),
    )
  })

  it('cannot lift a ban', async () => {
    renderApp('/users/u-ada')
    expect(await screen.findByText(/Bans are permanent/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reinstate Account' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ban Permanently' })).not.toBeInTheDocument()
  })
})
