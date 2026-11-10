import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileOutput, Search } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable, TableCard, type Column } from '@/components/testify/data-table'
import { Pagination } from '@/components/testify/pagination'
import { SelectField, type Option } from '@/components/testify/select-field'
import { buttonClass } from '@/components/testify/button-class'
import { useDownload } from '@/lib/api/download'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { daysAgo, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { BACKOFFICE } from '@/features/auth/auth-api'
import { usePermission } from '@/features/auth/use-permission'
import { shortId } from '@/features/moderation/report-format'
import {
  auditParams,
  useGetAuditFiltersQuery,
  useGetAuditLogQuery,
  type AuditEntry,
  type AuditQuery,
} from './audit-api'

const targetTypeLabel: Record<string, string> = {
  post: 'Post',
  comment: 'Comment',
  user: 'User',
  report: 'Report',
  role: 'Role',
  admin: 'Staff',
}

function targetLink(target: NonNullable<AuditEntry['target']>) {
  switch (target.type) {
    case 'user':
      return `/users/${target.reference}`
    case 'report':
      return `/moderation/${target.reference}`
    case 'role':
      return `/roles/${target.reference}`
    case 'admin':
      return `/staff/${target.reference}`
    case 'post':
    case 'comment':
      return `/moderation?search=${encodeURIComponent(target.reference)}`
    default:
      return null
  }
}

function TargetCell({ entry }: { entry: AuditEntry }) {
  if (!entry.target) return <span className="text-tf-dim">—</span>
  const href = targetLink(entry.target)
  const label = entry.target.name
    ? entry.target.type === 'user'
      ? `@${entry.target.name}`
      : entry.target.name
    : shortId(entry.target.reference)
  return (
    <span className="block min-w-0">
      {href ? (
        <Link
          to={href}
          className="block truncate hover:text-tf-lime"
          title={entry.target.reference}
        >
          {label}
        </Link>
      ) : (
        <span className="block truncate">{label}</span>
      )}
      <span className="text-[11px] text-tf-dim">
        {targetTypeLabel[entry.target.type] ?? entry.target.type}
      </span>
    </span>
  )
}

const columns: Column<AuditEntry>[] = [
  { key: 'action', header: 'Action', width: 210, cell: (row) => row.actionLabel },
  { key: 'moderator', header: 'Admin', width: 180, cell: (row) => row.actor?.name ?? 'System' },
  { key: 'target', header: 'Target', width: 180, cell: (row) => <TargetCell entry={row} /> },
  {
    key: 'timestamp',
    header: 'Timestamp',
    width: 200,
    cell: (row) => formatDateTime(row.createdAt),
  },
  {
    key: 'reason',
    header: 'Reason',
    width: 240,
    cell: (row) => (
      <span className="block truncate" title={row.reason ?? ''}>
        {row.reason ?? '—'}
      </span>
    ),
  },
]

const categoryOptions: Option[] = [
  { value: 'moderation', label: 'Moderation actions' },
  { value: 'admin', label: 'Admin & access' },
  { value: 'views', label: 'Profile views' },
  { value: '', label: 'All events' },
]
const dateOptions: Option[] = [
  { value: '30', label: 'Last 30 days' },
  { value: '7', label: 'Last 7 days' },
  { value: 'all', label: 'All time' },
]

export function AuditLogPage() {
  const canExport = usePermission('audit:export')
  const download = useDownload()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'moderation' | 'admin' | 'views' | ''>('moderation')
  const [action, setAction] = useState('')
  const [actor, setActor] = useState('')
  const [range, setRange] = useState('30')
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(query)
  const { data: filters } = useGetAuditFiltersQuery()
  const filterQuery: Omit<AuditQuery, 'page'> = {
    search,
    category,
    action: action || undefined,
    actorId: actor || undefined,
    from: range === 'all' ? undefined : daysAgo(Number(range)),
  }
  const { data, isFetching, isError } = useGetAuditLogQuery({ ...filterQuery, page })
  const update =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      setPage(1)
    }

  const selects: [string, Option[], string, (value: string) => void, string][] = [
    [
      'Filter by category',
      categoryOptions,
      category,
      (value) => setCategory(value as typeof category),
      'sm:w-[190px]',
    ],
    [
      'Filter by action',
      [{ value: '', label: 'All actions' }, ...(filters?.actions ?? [])],
      action,
      setAction,
      'sm:w-[190px]',
    ],
    [
      'Filter by admin',
      [
        { value: '', label: 'All admins' },
        ...(filters?.actors ?? []).map((item) => ({ value: item.id, label: item.name })),
      ],
      actor,
      setActor,
      'sm:w-[170px]',
    ],
    ['Date range', dateOptions, range, setRange, 'sm:w-[150px]'],
  ]

  return (
    <AdminLayout title="Audit Log">
      <TableCard
        aria-label="Audit log"
        title={
          <div className="flex w-full flex-wrap items-center gap-4 sm:-ml-4 sm:gap-[14px]">
            <label className="flex h-[46px] w-full items-center gap-[10px] rounded-full bg-tf-field px-6 sm:w-[300px]">
              <Search className="size-[18px] shrink-0 text-white" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => update(setQuery)(event.target.value)}
                aria-label="Search audit log"
                placeholder="Search by username, admin or ID..."
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-tf-slate"
              />
            </label>
            {selects.map(([label, opts, value, setter, width]) => (
              <SelectField
                key={label}
                aria-label={label}
                size="sm"
                options={opts}
                value={value}
                onValueChange={update(setter)}
                placeholderClassName="text-tf-slate"
                className={cn('w-full', width)}
              />
            ))}
            {canExport && (
              <button
                type="button"
                onClick={() =>
                  void download(
                    `${BACKOFFICE}/audit-logs/export`,
                    auditParams(filterQuery),
                    'testify-audit-log.csv',
                  )
                }
                className={cn(buttonClass.outline, 'h-[46px] gap-2 px-5 text-[14px]')}
              >
                <FileOutput className="size-[18px]" aria-hidden />
                Export
              </button>
            )}
          </div>
        }
        footer={
          data && data.totalPages > 1 ? (
            <Pagination
              tone="lime"
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        <DataTable
          rows={data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          rowLabel={(row) => `${row.actionLabel} by ${row.actor?.name ?? 'System'}`}
          emptyMessage={
            isError
              ? 'We couldn’t load the audit log.'
              : isFetching && !data
                ? 'Loading audit log…'
                : 'No audit entries match these filters.'
          }
        />
      </TableCard>
    </AdminLayout>
  )
}
