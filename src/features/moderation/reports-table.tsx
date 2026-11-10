import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { DataTable, type Column } from '@/components/testify/data-table'
import { TableStatus } from '@/components/testify/status-pill'
import { timeAgo } from '@/lib/format'
import type { ReportItem } from './moderation-api'
import { entityLabel, reportStatusLabel, reportStatusTone } from './report-status'
import { reportSummary, shortId } from './report-format'

export function ViewLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="inline-flex items-center gap-[9px] pl-[29px] text-[12px] font-semibold text-white hover:text-tf-lime"
    >
      <Eye className="size-4" aria-hidden fill="currentColor" stroke="var(--color-tf-page)" />
      View
    </Link>
  )
}

const columns: Column<ReportItem>[] = [
  {
    key: 'id',
    header: 'Report ID',
    width: 126,
    cell: (row) => <span title={row.id}>{shortId(row.id)}</span>,
  },
  {
    key: 'content',
    header: 'Reported content',
    width: 229,
    cell: (row) => (
      <span className="block max-w-[183px]">
        <span className="block truncate" title={reportSummary(row)}>
          {reportSummary(row)}
        </span>
        <span className="text-[11px] text-tf-dim">{entityLabel[row.entityType]}</span>
      </span>
    ),
  },
  {
    key: 'owner',
    header: 'Content Owner',
    width: 160,
    cell: (row) => `@${row.owner.username ?? 'unknown'}`,
  },
  { key: 'reason', header: 'Reason', width: 184, cell: (row) => row.reason },
  {
    key: 'status',
    header: 'Status',
    width: 158,
    cell: (row) => (
      <TableStatus tone={reportStatusTone[row.status]}>{reportStatusLabel[row.status]}</TableStatus>
    ),
  },
  { key: 'date', header: 'Date', width: 162, cell: (row) => timeAgo(row.createdAt) },
  {
    key: 'view',
    header: 'Action',
    width: 140,
    cell: (row) => (
      <ViewLink to={`/moderation/${row.id}`} label={`View report ${shortId(row.id)}`} />
    ),
  },
]

export function ReportsTable({
  rows,
  loading = false,
  error = false,
}: {
  rows: ReportItem[]
  loading?: boolean
  error?: boolean
}) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      rowLabel={(row) => `report ${shortId(row.id)}`}
      emptyMessage={
        error
          ? 'We couldn’t load the reports. Please try again.'
          : loading
            ? 'Loading reports…'
            : 'No reports match these filters.'
      }
    />
  )
}
