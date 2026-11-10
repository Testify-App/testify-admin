import { z } from 'zod'
import type { InviteRowResult, StaffInvitation } from './access-api'
import { phoneProblem, type Role } from './model'

export const maxInviteFileSize = 4 * 1024 * 1024
const columns = ['first_name', 'last_name', 'email', 'phone_number', 'role_id'] as const

/** A CSV row after review; `status` is final once the server has checked it too. */
export interface BulkInviteRow extends StaffInvitation {
  /** Role name for display. */
  role: string
  status: 'valid' | 'invalid'
  reason?: string
}

/**
 * Applies the server's verdict (emails already registered, phones in use, unknown roles) to the
 * rows that passed the local checks, in order.
 */
export function mergeServerReview(
  rows: BulkInviteRow[],
  server: InviteRowResult[],
): BulkInviteRow[] {
  let next = 0
  return rows.map((row) => {
    if (row.status !== 'valid') return row
    const verdict = server[next++]
    if (!verdict || verdict.status === 'valid')
      return {
        ...row,
        firstName: verdict?.firstName ?? row.firstName,
        lastName: verdict?.lastName ?? row.lastName,
        phone: verdict?.phone ?? row.phone,
      }
    return { ...row, status: 'invalid', reason: verdict.reason || 'Cannot be invited.' }
  })
}

export function validateInvitation(row: StaffInvitation) {
  if (!row.firstName.trim() || row.firstName.trim().length > 100)
    return 'Enter a first name of 100 characters or fewer.'
  if (!row.lastName.trim() || row.lastName.trim().length > 100)
    return 'Enter a last name of 100 characters or fewer.'
  if (!z.email().safeParse(row.email.trim()).success) return 'Enter a valid email address.'
  const phone = phoneProblem(row.phone)
  if (phone) return phone
  if (!row.roleId) return 'Select an assigned role.'
  return ''
}

/** CSV template with an example row, pre-filled with `roleId` when one is given. */
export function inviteTemplate(roleId = 'role-id-here') {
  return `${columns.join(',')}\r\nJane,Doe,jane.doe@testify.app,+234 803 555 0100,${roleId}\r\n`
}

/** Minimal RFC 4180 parser: quoted fields, escaped quotes and CRLF line endings. */
function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]!
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (field || row.length) rows.push([...row, field])
  return rows.filter((cells) => cells.some((cell) => cell.trim()))
}

/**
 * Reads a bulk-invite CSV and checks every row locally: required fields, phone format, a known
 * role (by id or name) and emails repeated in the file. The server then checks the rest.
 */
export function reviewInviteCsv(text: string, roles: Pick<Role, 'id' | 'name'>[]): BulkInviteRow[] {
  const [header, ...lines] = parseCsv(text.replace(/^﻿/, ''))
  const index = Object.fromEntries(
    columns.map((column) => [
      column,
      header?.findIndex((cell) => cell.trim().toLowerCase() === column) ?? -1,
    ]),
  ) as Record<(typeof columns)[number], number>
  if (index.first_name < 0 || index.last_name < 0 || index.email < 0 || index.role_id < 0)
    throw new Error('The CSV is missing required columns. Use the downloadable template.')
  if (!lines.length) throw new Error('The CSV has no staff rows.')
  const seen = new Set<string>()
  return lines.map((cells) => {
    const cell = (column: (typeof columns)[number]) => (cells[index[column]] ?? '').trim()
    const roleCell = cell('role_id')
    const role = roles.find(
      (item) => item.id === roleCell || item.name.toLowerCase() === roleCell.toLowerCase(),
    )
    const invite: StaffInvitation = {
      firstName: cell('first_name'),
      lastName: cell('last_name'),
      email: cell('email'),
      phone: index.phone_number < 0 ? '' : cell('phone_number'),
      roleId: role?.id ?? '',
    }
    const email = invite.email.toLowerCase()
    const reason =
      (roleCell && !role ? 'Unknown role.' : validateInvitation(invite)) ||
      (seen.has(email) ? 'Email is repeated in this file.' : '')
    seen.add(email)
    return {
      ...invite,
      role: role?.name ?? roleCell,
      status: reason ? 'invalid' : 'valid',
      ...(reason ? { reason } : {}),
    }
  })
}
