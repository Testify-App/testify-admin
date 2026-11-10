import { useState } from 'react'
import { ArrowDownUp, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BulkInviteRow } from '../staff-invitations'

export function BulkInviteProgress() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center"
    >
      <LoaderCircle
        aria-hidden
        className="mb-6 size-20 animate-spin text-tf-lime motion-reduce:animate-none"
      />
      <p className="text-[16px] font-semibold">Validating staff details…</p>
      <p className="mt-2 max-w-80 text-[13px] leading-5 text-tf-muted">
        Please wait while we process your file.
      </p>
    </div>
  )
}

/** Validated CSV rows; only rows marked ready are invited. */
export function BulkInvitePreview({
  rows,
  onReplace,
}: {
  rows: BulkInviteRow[]
  onReplace: () => void
}) {
  const [sort, setSort] = useState<'asc' | 'desc' | null>(null)
  const name = (row: BulkInviteRow) => `${row.firstName} ${row.lastName}`.trim()
  const results = sort
    ? [...rows].sort((a, b) => name(a).localeCompare(name(b)) * (sort === 'asc' ? 1 : -1))
    : rows
  const invalid = rows.filter((row) => row.status === 'invalid').length
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 px-6 py-6 sm:px-8">
      {invalid > 0 && (
        <p className="rounded-[12px] bg-[#2d2b18] px-4 py-3 text-[13px] text-tf-gold">
          {invalid} {invalid === 1 ? 'row' : 'rows'} will not be invited. Only rows marked ready are
          sent.
        </p>
      )}
      <div className="min-h-0 min-w-0 overflow-auto rounded-[16px] bg-tf-page p-3">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[13px]">
          <thead>
            <tr className="text-tf-muted [&>th]:sticky [&>th]:top-0 [&>th]:h-11 [&>th]:bg-tf-field [&>th]:px-3 [&>th]:font-normal">
              <th
                scope="col"
                className="rounded-l-[10px]"
                aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'}
              >
                <button
                  type="button"
                  onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-2"
                >
                  Name
                  <ArrowDownUp className="size-3" aria-hidden />
                </button>
              </th>
              <th scope="col">Email Address</th>
              <th scope="col">Phone Number</th>
              <th scope="col">Role</th>
              <th scope="col" className="rounded-r-[10px]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr
                key={`${row.email}-${index}`}
                className="[&>td]:border-b [&>td]:border-tf-rule [&>td]:px-3 [&>td]:py-3"
              >
                <td>{name(row) || '—'}</td>
                <td className="break-all">{row.email || '—'}</td>
                <td>{row.phone || '—'}</td>
                <td>{row.role || 'Unknown role'}</td>
                <td className={cn(row.status === 'valid' ? 'text-tf-green' : 'text-[#f97066]')}>
                  {row.status === 'valid' ? 'Ready to invite' : row.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-right text-[13px] text-tf-muted">
        Need to make an edit to this file?{' '}
        <button type="button" className="text-tf-lime underline" onClick={onReplace}>
          Upload New File
        </button>
      </p>
    </div>
  )
}
