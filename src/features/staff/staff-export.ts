import { formatDate, staffName, type StaffMember } from '@/features/roles/model'

/** Quotes a cell and neutralises spreadsheet formulas (CSV injection). */
function quoteCell(value: string) {
  const safe = /^[\t\r\n]|^\s*[=+@-]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

export function staffToCsv(staff: StaffMember[]) {
  const rows = [
    ['Name', 'Email Address', 'Phone Number', 'Role', 'Invite Date', 'Status'],
    ...staff.map((member) => [
      staffName(member),
      member.email,
      member.phone,
      member.roleName ?? 'Unassigned',
      formatDate(member.createdAt),
      member.status,
    ]),
  ]
  return rows.map((row) => row.map(quoteCell).join(',')).join('\r\n')
}
