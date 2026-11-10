import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'
import { backoffice } from '@/test/backoffice-mock'
import { staffToCsv } from './staff-export'

const findStaff = (id: string) => backoffice().staff.find((staff) => staff.id === id)

describe('staff management', () => {
  it('shows totals and searches the staff list', async () => {
    const { user } = renderApp('/staff')
    const totals = await screen.findByRole('region', { name: 'Staff totals' })
    await waitFor(() =>
      expect(within(totals).getByText('Number of Staff').nextSibling).toHaveTextContent('12'),
    )
    expect(within(totals).getByText('Pending').nextSibling).toHaveTextContent('3')
    await user.type(screen.getByLabelText('Search staff'), 'kwame')
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2))
    expect(screen.getByText('Kwame Asante')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    const { user } = renderApp('/staff')
    await user.click(await screen.findByRole('button', { name: 'Filter' }))
    const form = await screen.findByRole('form', { name: 'Staff filters' })
    await user.click(within(form).getByRole('radio', { name: 'Inactive' }))
    await user.click(within(form).getByRole('button', { name: 'Apply filter(s)' }))
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))
    expect(screen.getByRole('button', { name: 'Filter (1 active)' })).toBeInTheDocument()
  })

  it('invites a staff member as pending', async () => {
    const { user } = renderApp('/staff')
    await user.click(await screen.findByRole('button', { name: 'Add New Staff' }))
    const sheet = await screen.findByRole('dialog', { name: 'Invite Staff' })
    await user.type(within(sheet).getByLabelText('First Name'), 'Ngozi')
    await user.type(within(sheet).getByLabelText('Last Name'), 'Obi')
    await user.type(within(sheet).getByLabelText('Email Address'), 'Grace.Mensah@testify.app')
    await user.selectOptions(within(sheet).getByLabelText('Assigned Role'), 'moderator')
    await user.click(within(sheet).getByRole('button', { name: 'Send Invite' }))
    expect(await within(sheet).findByRole('alert')).toHaveTextContent('Email already exists')

    await user.clear(within(sheet).getByLabelText('Email Address'))
    await user.type(within(sheet).getByLabelText('Email Address'), 'ngozi.obi@testify.app')
    await user.click(within(sheet).getByRole('button', { name: 'Send Invite' }))
    await waitFor(() =>
      expect(backoffice().staff[0]).toMatchObject({
        email: 'ngozi.obi@testify.app',
        status: 'pending_invitation',
        roleId: 'moderator',
      }),
    )
    expect(await screen.findByText('Ngozi Obi')).toBeInTheDocument()
  })

  it('suspends and reactivates an admin, recording the activity', async () => {
    const { user } = renderApp('/staff/grace')
    await user.click(await screen.findByRole('button', { name: 'Suspend Admin' }))
    const sheet = await screen.findByRole('dialog', { name: 'Suspend Admin' })
    expect(within(sheet).getByRole('button', { name: 'Suspend' })).toBeDisabled()
    await user.click(within(sheet).getByRole('radio', { name: 'Fraudulent activities.' }))
    await user.click(within(sheet).getByRole('button', { name: 'Suspend' }))
    expect(await screen.findByText('Reason: Fraudulent activities.')).toBeInTheDocument()
    expect(findStaff('grace')?.status).toBe('suspended')

    await user.click(await screen.findByRole('button', { name: 'Reactivate Admin' }))
    expect(await screen.findByText('Test Admin reactivated Grace Mensah')).toBeInTheDocument()
    expect(findStaff('grace')?.status).toBe('active')
  })

  it('edits details from the row menu', async () => {
    const { user } = renderApp('/staff')
    await user.click(await screen.findByRole('button', { name: 'Actions for Daniel Eze' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit Admin' }))
    const sheet = await screen.findByRole('dialog', { name: 'Edit Details' })
    const phone = within(sheet).getByLabelText('Phone Number')
    await user.clear(phone)
    await user.type(phone, '12ab')
    await user.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(await within(sheet).findByRole('alert')).toHaveTextContent('valid phone number')
    await user.clear(phone)
    await user.type(phone, '+234 809 000 1111')
    await user.selectOptions(within(sheet).getByLabelText('Role'), 'content-reviewer')
    await user.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(findStaff('daniel')).toMatchObject({
        phone: '+234 809 000 1111',
        roleId: 'content-reviewer',
      }),
    )
  })
})

describe('staff export', () => {
  it('quotes cells and neutralises formulas', () => {
    const csv = staffToCsv([
      {
        id: 'adaeze',
        firstName: '=SUM(A1)',
        lastName: 'Okafor',
        email: 'adaeze.okafor@testify.app',
        phone: '',
        roleId: 'super-admin',
        roleName: 'Super Admin',
        status: 'Active',
        createdAt: '2026-01-12T09:00:00.000Z',
        lastLogin: null,
        isRoot: true,
      },
    ])
    const [header, row] = csv.split('\r\n')
    expect(header).toBe('"Name","Email Address","Phone Number","Role","Invite Date","Status"')
    expect(row).toContain(`"'=SUM(A1) Okafor"`)
    expect(row).toContain('"Super Admin"')
  })
})
