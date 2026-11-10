import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'
import { backoffice } from '@/test/backoffice-mock'
import { mergeServerReview, reviewInviteCsv } from './staff-invitations'

const roleList = backoffice().roles.map(({ id, name }) => ({ id, name }))

describe('roles & permissions', () => {
  it('lists roles and filters them by name', async () => {
    const { user } = renderApp('/roles')
    expect(await screen.findByRole('heading', { name: 'List of Roles (5)' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search roles'), 'mod')
    expect(screen.getByRole('link', { name: 'Moderator' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Super Admin' })).not.toBeInTheDocument()
  })

  it('creates a role through details, permissions and admins', async () => {
    const { user } = renderApp('/roles')
    await user.click(await screen.findByRole('button', { name: 'Add New Role' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add Role' })
    await user.type(within(sheet).getByLabelText('Role Name'), 'Moderator')
    await user.type(within(sheet).getByLabelText('Description'), 'Duplicate name')
    await user.click(within(sheet).getByRole('button', { name: 'Add Role' }))
    expect(within(sheet).getByRole('alert')).toHaveTextContent('already exists')

    await user.clear(within(sheet).getByLabelText('Role Name'))
    await user.type(within(sheet).getByLabelText('Role Name'), 'Appeals Lead')
    await user.click(within(sheet).getByRole('button', { name: 'Add Role' }))

    const saveContinue = await screen.findByRole('button', { name: 'Save & Continue' })
    expect(saveContinue).toBeDisabled()
    await user.click(screen.getByRole('switch', { name: 'All Hidden Content permissions' }))
    expect(screen.getByRole('heading', { name: 'Permissions (2)' })).toBeInTheDocument()
    await user.click(saveContinue)

    expect(await screen.findByRole('heading', { name: 'Add Admin' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search staff'), 'esther')
    await user.click(await screen.findByRole('checkbox', { name: 'Select Esther Ibrahim' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('heading', { name: 'Appeals Lead' })).toBeInTheDocument()
    const role = backoffice().roles.find((item) => item.name === 'Appeals Lead')!
    expect(role.permissionIds).toEqual(['hidden:view', 'hidden:update'])
    expect(backoffice().staff.find((s) => s.id === 'esther')?.roleId).toBe(role.id)
    expect(await screen.findByRole('tab', { name: 'Admins (1)' })).toBeInTheDocument()
  }, 30_000)

  it('locks the built-in role', async () => {
    const { user } = renderApp('/roles/super-admin')
    expect(await screen.findByRole('button', { name: 'Edit Details' })).toBeDisabled()
    await user.click(screen.getByRole('tab', { name: /Permissions/ }))
    expect(screen.queryByRole('button', { name: 'Edit Permissions' })).not.toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Overview: View' })).toBeDisabled()
  })

  it('edits the permissions of a custom role', async () => {
    const { user } = renderApp('/roles/support-agent')
    await user.click(await screen.findByRole('tab', { name: 'Permissions (3)' }))
    await user.click(screen.getByRole('button', { name: 'Edit Permissions' }))
    await user.click(screen.getByRole('switch', { name: 'Audit Log: View' }))
    await user.click(screen.getByRole('button', { name: 'Save Permissions' }))
    expect(await screen.findByRole('tab', { name: 'Permissions (4)' })).toBeInTheDocument()
  })

  it('moves an admin to another role', async () => {
    const { user } = renderApp('/roles/trust-analyst')
    await user.click(await screen.findByRole('button', { name: 'Change role for Kwame Asante' }))
    const sheet = await screen.findByRole('dialog', { name: 'Change Role' })
    await user.selectOptions(within(sheet).getByLabelText('New role'), 'moderator')
    await user.click(within(sheet).getByRole('button', { name: 'Move Admin' }))
    expect(await screen.findByRole('tab', { name: 'Admins (1)' })).toBeInTheDocument()
    expect(backoffice().staff.find((s) => s.id === 'kwame')?.roleId).toBe('moderator')
  })

  it('will not delete a role that admins still hold', async () => {
    const { user } = renderApp('/roles')
    await user.click(await screen.findByRole('button', { name: 'Options for Moderator' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete Role' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete Moderator?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete Role' }))
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(backoffice().roles.some((role) => role.id === 'moderator')).toBe(true)
  })

  it('deactivates a custom role', async () => {
    const { user } = renderApp('/roles')
    await user.click(await screen.findByRole('button', { name: 'Options for Moderator' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Deactivate Role' }))
    await waitFor(() =>
      expect(backoffice().roles.find((role) => role.id === 'moderator')?.status).toBe('Inactive'),
    )
  })

  it('hides role management actions the admin is not permitted to use', async () => {
    renderApp('/roles', {
      session: {
        token: 'viewer',
        user: {
          id: 'viewer',
          name: 'Viewer',
          email: 'viewer@testify.app',
          permissions: ['roles:view'],
        },
      },
    })
    expect(await screen.findByRole('heading', { name: 'List of Roles (5)' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add New Role' })).not.toBeInTheDocument()
  })
})

describe('bulk invite CSV', () => {
  it('flags unknown roles, bad emails and duplicates', () => {
    const csv = [
      'first_name,last_name,email,phone_number,role_id',
      'Jane,Doe,jane@testify.app,,moderator',
      '"Ola, Jr",Ade,ola@testify.app,+234 803 555 0100,Content Reviewer',
      'Sam,Lee,jane@testify.app,,moderator',
      'Bad,Email,not-an-email,,moderator',
      'Grace,Mensah,grace.mensah@testify.app,,moderator',
      'No,Role,norole@testify.app,,ghost',
    ].join('\r\n')
    const rows = reviewInviteCsv(csv, roleList)
    expect(rows[1]).toMatchObject({ firstName: 'Ola, Jr', roleId: 'content-reviewer' })
    expect(rows.map((row) => row.reason ?? '')).toEqual([
      '',
      '',
      'Email is repeated in this file.',
      'Enter a valid email address.',
      '',
      'Unknown role.',
    ])
    // The server then rejects the address that is already registered.
    const merged = mergeServerReview(rows, [
      { ...rows[0]!, roleName: 'Moderator', status: 'valid', reason: '' },
      { ...rows[1]!, roleName: 'Content Reviewer', status: 'valid', reason: '' },
      { ...rows[4]!, roleName: 'Moderator', status: 'invalid', reason: 'Email already exists.' },
    ])
    expect(merged.map((row) => row.status)).toEqual([
      'valid',
      'valid',
      'invalid',
      'invalid',
      'invalid',
      'invalid',
    ])
    expect(merged[4]!.reason).toBe('Email already exists.')
  })

  it('rejects a file without the template columns', () => {
    expect(() => reviewInviteCsv('name,email\nJane,jane@x.com', roleList)).toThrow(
      /missing required columns/,
    )
  })
})
