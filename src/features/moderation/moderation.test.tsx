import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'
import { moderationState } from '@/test/moderation-mock'

const report = (id: string) => moderationState().reports.find((r) => r.id === id)!

describe('overview', () => {
  it('shows live report counts and recent reports', async () => {
    renderApp('/')
    expect(await screen.findByText('Pending Reports')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Pending Reports').nextSibling).toHaveTextContent('2'),
    )
    expect(screen.getAllByText('Under Review')[0]!.nextSibling).toHaveTextContent('1')
    expect(await screen.findAllByRole('link', { name: /View report/ })).toHaveLength(4)
  })
})

describe('moderation queue', () => {
  it('filters on the server once Apply Filter is pressed', async () => {
    const { user } = renderApp('/moderation')
    const table = await screen.findByRole('table')
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(5))
    await user.selectOptions(screen.getByLabelText('Content type'), 'comment')
    expect(within(table).getAllByRole('row')).toHaveLength(5)
    await user.click(screen.getByRole('button', { name: 'Apply Filter' }))
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(2))
    expect(within(table).getByText('Harassment or bullying')).toBeInTheDocument()
  })

  it('opens with a search from the URL', async () => {
    renderApp('/moderation?search=post-spam')
    const table = await screen.findByRole('table')
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(3))
    expect(screen.getByLabelText('Search reports')).toHaveValue('post-spam')
  })
})

describe('report detail', () => {
  it('requires an account action before issuing it', async () => {
    const { user } = renderApp('/moderation/rep-spam-1')
    await user.click(await screen.findByLabelText(/Take Account Action/))
    await user.click(screen.getByRole('button', { name: 'Issue Warning' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Select an account action to continue.')
    await user.selectOptions(screen.getByLabelText(/Select Action/), 'suspend')
    expect(screen.getByLabelText('Suspension length')).toHaveValue('7')
    expect(screen.getByRole('button', { name: 'Suspend Account' })).toBeInTheDocument()
  })

  it('marks under review, removes the content and closes the related report', async () => {
    const { user } = renderApp('/moderation/rep-spam-1')
    expect(await screen.findByText('1 other report on this content')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark as Under Review' }))
    await waitFor(() => expect(report('rep-spam-1').status).toBe('under_review'))
    await user.click(await screen.findByLabelText(/Remove Content/))
    await user.type(screen.getByLabelText('Review Notes'), 'Obvious spam')
    await user.click(screen.getByRole('button', { name: 'Remove Content' }))
    expect(await screen.findByRole('dialog', { name: 'Report resolved' })).toBeInTheDocument()
    expect(report('rep-spam-1')).toMatchObject({
      status: 'resolved',
      decision: 'remove_content',
      notes: 'Obvious spam',
    })
    expect(report('rep-spam-2').status).toBe('resolved')
    expect(moderationState().content.find((c) => c.id === 'post-spam')!.hidden_at).not.toBeNull()
  })

  it('suspends the owner through an account action', async () => {
    const { user } = renderApp('/moderation/rep-comment')
    await user.click(await screen.findByLabelText(/Take Account Action/))
    await user.selectOptions(screen.getByLabelText(/Select Action/), 'suspend')
    await user.selectOptions(screen.getByLabelText('Suspension length'), '30')
    await user.click(screen.getByRole('button', { name: 'Suspend Account' }))
    expect(await screen.findByRole('dialog', { name: 'Report resolved' })).toBeInTheDocument()
    expect(moderationState().users.find((u) => u.id === 'u-john')!.moderation_status).toBe(
      'suspended',
    )
  })

  it('shows the outcome of a resolved report', async () => {
    renderApp('/moderation/rep-user')
    expect(await screen.findByRole('heading', { name: /Report #/ })).toBeInTheDocument()
    expect(screen.getByText('Outcome').nextSibling).toHaveTextContent('No action')
  })

  it('hides decisions from admins without moderation:update', async () => {
    renderApp('/moderation/rep-spam-1', {
      session: {
        token: 't',
        user: {
          id: 'viewer',
          name: 'Viewer',
          email: 'v@testify.app',
          permissions: ['moderation:view'],
        },
      },
    })
    expect(
      await screen.findByText(/You can view this report but not resolve it/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as Under Review' })).not.toBeInTheDocument()
  })
})

describe('reporter profile', () => {
  it('lists the reporter’s submissions', async () => {
    renderApp('/moderation/rep-spam-1/reporter')
    expect(await screen.findByRole('heading', { name: 'Reporter Profile' })).toBeInTheDocument()
    expect(await screen.findByText('Showing 3 of 3 submitted reports')).toBeInTheDocument()
  })
})
