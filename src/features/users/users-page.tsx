import { useState } from 'react'
import { Search } from 'lucide-react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable, TableCard, type Column } from '@/components/testify/data-table'
import { Pagination } from '@/components/testify/pagination'
import { SelectField, type Option } from '@/components/testify/select-field'
import { TableStatus } from '@/components/testify/status-pill'
import { tabClass } from '@/components/testify/form-styles'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { daysAgo, formatDate, formatDateTime, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ViewLink } from '@/features/moderation/reports-table'
import { standingLabel, standingTone } from '@/features/moderation/report-status'
import { useGetAppUsersQuery, type AppUser, type UserQuery } from './users-api'

const PAGE_SIZE = 10

const identity = (row: AppUser) => (
  <span className="block min-w-0">
    <span className="block truncate font-semibold">@{row.username ?? 'no-username'}</span>
    <span className="block truncate text-[12px] text-tf-dim">{row.displayName || row.name}</span>
  </span>
)

const statusCell = (row: AppUser) => (
  <TableStatus tone={standingTone[row.standing]}>{standingLabel[row.standing]}</TableStatus>
)
const viewCell = (row: AppUser) => (
  <ViewLink to={`/users/${row.id}`} label={`View @${row.username ?? row.id}`} />
)

const allColumns: Column<AppUser>[] = [
  { key: 'user', header: 'User', width: 220, cell: identity },
  {
    key: 'email',
    header: 'Email',
    width: 230,
    cell: (row) => <span className="block truncate">{row.email ?? '—'}</span>,
  },
  { key: 'joined', header: 'Joined', width: 140, cell: (row) => formatDate(row.createdAt) },
  {
    key: 'login',
    header: 'Last login',
    width: 150,
    cell: (row) => (row.lastLogin ? timeAgo(row.lastLogin) : 'Never'),
  },
  { key: 'reports', header: 'Reports', width: 100, cell: (row) => row.reportsAgainst },
  { key: 'status', header: 'Status', width: 140, cell: statusCell },
  { key: 'view', header: 'Action', width: 110, cell: viewCell },
]

const restrictedColumns: Column<AppUser>[] = [
  { key: 'user', header: 'User', width: 210, cell: identity },
  { key: 'status', header: 'Restriction', width: 140, cell: statusCell },
  {
    key: 'reason',
    header: 'Reason',
    width: 220,
    cell: (row) => (
      <span className="block truncate" title={row.restriction?.reason ?? ''}>
        {row.restriction?.reason ?? '—'}
      </span>
    ),
  },
  {
    key: 'since',
    header: 'Since',
    width: 150,
    cell: (row) => formatDate(row.restriction?.startedAt),
  },
  {
    key: 'duration',
    header: 'Duration',
    width: 170,
    cell: (row) =>
      row.standing === 'banned'
        ? 'Permanent'
        : row.suspendedUntil
          ? `Until ${formatDateTime(row.suspendedUntil)}`
          : 'Indefinite',
  },
  { key: 'view', header: 'Action', width: 110, cell: viewCell },
]

const statusOptions: Option[] = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
]
const restrictedStatusOptions: Option[] = [
  { value: 'restricted', label: 'Suspended & banned' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
]
const joinedOptions: Option[] = [
  { value: '', label: 'Joined any time' },
  { value: '7', label: 'Joined in the last 7 days' },
  { value: '30', label: 'Joined in the last 30 days' },
  { value: '90', label: 'Joined in the last 90 days' },
]
const sortOptions: Option[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'username', label: 'Username A–Z' },
  { value: 'last_login', label: 'Recently active' },
  { value: 'reports', label: 'Most reported' },
]
const restrictedSortOptions: Option[] = [
  { value: 'restricted_recent', label: 'Most recent action' },
  { value: 'restriction_type', label: 'Type (ban / suspension)' },
  { value: 'username', label: 'Username A–Z' },
]

function UsersTab({ restricted }: { restricted: boolean }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(restricted ? 'restricted' : '')
  const [joined, setJoined] = useState('')
  const [flagged, setFlagged] = useState(false)
  const [sort, setSort] = useState(restricted ? 'restricted_recent' : 'newest')
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(query)
  const request: UserQuery = {
    page,
    limit: PAGE_SIZE,
    search,
    status: status as UserQuery['status'],
    flagged,
    joinedFrom: joined ? daysAgo(Number(joined)) : undefined,
    sort,
  }
  const { data, isFetching, isError } = useGetAppUsersQuery(request)
  const reset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      setPage(1)
    }

  return (
    <TableCard
      title={
        <div className="flex w-full flex-wrap items-center gap-3 sm:-ml-4">
          <label className="flex h-[46px] w-full items-center gap-[10px] rounded-full bg-tf-field px-6 sm:w-[320px]">
            <Search className="size-[18px] shrink-0 text-white" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => reset(setQuery)(event.target.value)}
              aria-label="Search users"
              placeholder="Search by username, name, email or ID..."
              className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-tf-slate"
            />
          </label>
          <SelectField
            aria-label="Filter by status"
            size="sm"
            className="w-full sm:w-[170px]"
            options={restricted ? restrictedStatusOptions : statusOptions}
            value={status}
            onValueChange={reset(setStatus)}
          />
          {!restricted && (
            <SelectField
              aria-label="Filter by join date"
              size="sm"
              className="w-full sm:w-[210px]"
              options={joinedOptions}
              value={joined}
              onValueChange={reset(setJoined)}
            />
          )}
          <SelectField
            aria-label="Sort users"
            size="sm"
            className="w-full sm:w-[190px]"
            options={restricted ? restrictedSortOptions : sortOptions}
            value={sort}
            onValueChange={reset(setSort)}
          />
          {!restricted && (
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-tf-silver">
              <input
                type="checkbox"
                checked={flagged}
                onChange={(event) => reset(setFlagged)(event.target.checked)}
                className="size-4 accent-[#d9ef00]"
              />
              Flagged only
            </label>
          )}
          {isFetching && (
            <span role="status" className="text-[13px] text-tf-muted">
              Loading…
            </span>
          )}
        </div>
      }
      footer={
        data && data.totalPages > 1 ? (
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        ) : null
      }
    >
      <DataTable
        rows={data?.items ?? []}
        columns={restricted ? restrictedColumns : allColumns}
        rowKey={(row) => row.id}
        rowLabel={(row) => `@${row.username ?? row.id}`}
        emptyMessage={
          isError
            ? 'We couldn’t load users. Please try again.'
            : !data
              ? 'Loading users…'
              : restricted
                ? 'No suspended or banned users.'
                : 'No users match your search.'
        }
      />
    </TableCard>
  )
}

export function UsersPage() {
  return (
    <AdminLayout title="Users">
      <TabsPrimitive.Root defaultValue="all">
        <TabsPrimitive.List
          aria-label="User lists"
          className="-mt-[2px] mb-8 flex gap-[56px] overflow-x-auto border-b border-[#2b2e33]"
        >
          <TabsPrimitive.Trigger value="all" className={cn(tabClass, 'pr-[21px]')}>
            All Users
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="restricted" className={cn(tabClass, 'px-[25px]')}>
            Suspended / Banned
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>
        <TabsPrimitive.Content value="all">
          <UsersTab restricted={false} />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="restricted">
          <UsersTab restricted />
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </AdminLayout>
  )
}
