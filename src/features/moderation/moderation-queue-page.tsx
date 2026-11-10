import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileOutput, Search } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { TableCard } from '@/components/testify/data-table'
import { Pagination } from '@/components/testify/pagination'
import { SelectField, type Option } from '@/components/testify/select-field'
import { buttonClass } from '@/components/testify/button-class'
import { useDownload } from '@/lib/api/download'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { daysAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePermissionCheck } from '@/features/auth/use-permission'
import { BACKOFFICE } from '@/features/auth/auth-api'
import {
  reportParams,
  useGetModeratorsQuery,
  useGetReportReasonsQuery,
  useGetReportsQuery,
  type ReportEntityType,
  type ReportQuery,
  type ReportStatus,
} from './moderation-api'
import { ReportsTable } from './reports-table'

const PAGE_SIZE = 10

const statusOptions: Option[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
]
const typeOptions: Option[] = [
  { value: '', label: 'All content' },
  { value: 'post', label: 'Testimonies' },
  { value: 'comment', label: 'Comments' },
  { value: 'user', label: 'Accounts' },
  { value: 'message', label: 'Messages' },
]
const dateOptions: Option[] = [
  { value: '', label: 'Last seven days' },
  { value: 'today', label: 'Today' },
  { value: '30', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

interface Filters {
  status: string
  type: string
  reason: string
  date: string
  moderator: string
}
const noFilters: Filters = { status: '', type: '', reason: '', date: '', moderator: '' }

/** Turns the filter form into the report query (dates become a `from` day). */
function toReportQuery(filters: Filters, search: string): Omit<ReportQuery, 'page' | 'limit'> {
  const from =
    filters.date === 'all'
      ? undefined
      : daysAgo(filters.date === 'today' ? 0 : filters.date === '30' ? 30 : 7)
  return {
    search,
    status: filters.status as ReportStatus | '',
    entityType: filters.type as ReportEntityType | '',
    reason: filters.reason || undefined,
    moderatorId: filters.moderator || undefined,
    from,
  }
}

const filterLabelClass = 'mb-[11px] block text-[16px] leading-5 font-semibold'

export function ModerationQueuePage() {
  const can = usePermissionCheck()
  const download = useDownload()
  const [params] = useSearchParams()
  // ?search= lets other screens (e.g. a member's flagged content) open the matching reports.
  const [query, setQuery] = useState(() => params.get('search') ?? '')
  const [draft, setDraft] = useState<Filters>(noFilters)
  const [applied, setApplied] = useState<Filters>(noFilters)
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(query)
  const filterQuery = toReportQuery(applied, search)
  const { data, isFetching, isError } = useGetReportsQuery({
    ...filterQuery,
    page,
    limit: PAGE_SIZE,
  })
  const { data: reasons = [] } = useGetReportReasonsQuery()
  const { data: moderators = [] } = useGetModeratorsQuery()
  const setFilter = (key: keyof Filters) => (value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }))
  const canExport = can('moderation:export') || can('reports:export')

  const fields: [keyof Filters, string, Option[]][] = [
    ['status', 'Status', statusOptions],
    ['type', 'Content type', typeOptions],
    [
      'reason',
      'Report reason',
      [
        { value: '', label: 'All reasons' },
        ...reasons.map((r) => ({ value: r.code, label: r.label })),
      ],
    ],
    ['date', 'Date', dateOptions],
    [
      'moderator',
      'Moderator',
      [
        { value: '', label: 'All moderators' },
        ...moderators.map((m) => ({ value: m.id, label: m.name })),
      ],
    ],
  ]

  return (
    <AdminLayout title="Moderation">
      <section aria-label="Filters" className="rounded-[20px] bg-tf-panel px-5 pt-8 pb-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex h-14 w-full max-w-[497px] items-center gap-[10px] rounded-full bg-tf-field px-6">
            <Search className="size-5 shrink-0 text-white" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              aria-label="Search reports"
              placeholder="Search by report ID, content ID, username..."
              className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-tf-faint"
            />
          </label>
          {canExport && (
            <button
              type="button"
              onClick={() =>
                void download(
                  `${BACKOFFICE}/moderation/reports/export`,
                  reportParams(filterQuery),
                  'moderation-reports.csv',
                )
              }
              className={cn(
                buttonClass.outline,
                'h-14 w-[187px] gap-[14px] border-tf-outline text-tf-grey hover:text-white',
              )}
            >
              <FileOutput
                className="size-7 text-white"
                aria-hidden
                fill="currentColor"
                stroke="var(--color-tf-panel)"
              />
              Export
            </button>
          )}
        </div>
        <form
          className="mt-[25px] grid items-end gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_187px]"
          onSubmit={(event) => {
            event.preventDefault()
            setApplied(draft)
            setPage(1)
          }}
        >
          {fields.map(([key, label, options]) => (
            <div key={key}>
              <label htmlFor={`filter-${key}`} className={filterLabelClass}>
                {label}
              </label>
              <SelectField
                id={`filter-${key}`}
                options={options}
                value={draft[key]}
                onValueChange={setFilter(key)}
              />
            </div>
          ))}
          <button type="submit" className={cn(buttonClass.primary, 'h-14 w-full xl:ml-[-1px]')}>
            Apply Filter
          </button>
        </form>
      </section>

      <TableCard
        className="mt-8"
        title={`All reports${data ? ` (${data.total})` : ''}`}
        footer={
          data && data.totalPages > 1 ? (
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          ) : null
        }
      >
        <ReportsTable rows={data?.items ?? []} loading={isFetching && !data} error={isError} />
      </TableCard>
    </AdminLayout>
  )
}
