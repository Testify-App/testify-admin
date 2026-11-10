import { useEffect, useRef, useState } from 'react'
import { ArrowDownUp, Download, Plus, UserCheck, UserRoundPlus, UserX, Users } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable, TableCard, type Column } from '@/components/testify/data-table'
import { SearchField } from '@/components/testify/search-field'
import { StatCard } from '@/components/testify/stat-card'
import { TablePagination } from '@/components/testify/table-pagination'
import { buttonClass } from '@/components/testify/button-class'
import { errorMessage } from '@/lib/api/base-api'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { cn } from '@/lib/utils'
import { usePermission } from '@/features/auth/use-permission'
import {
  EXPORT_LIMIT,
  useGetStaffQuery,
  useGetStaffSummaryQuery,
  useLazyGetStaffQuery,
  type StaffQuery,
} from '@/features/roles/access-api'
import { formatDate, staffName, type StaffMember } from '@/features/roles/model'
import { InviteStaffDialog } from '@/features/roles/components/invite-staff-dialog'
import { StaffIdentity } from '@/features/roles/components/staff-identity'
import { StatusBadge } from '@/features/roles/components/status-badge'
import { EditStaffDialog } from './components/edit-staff-dialog'
import { StaffActions } from './components/staff-actions'
import { StaffFilters } from './components/staff-filters'
import { SuspendStaffDialog } from './components/suspend-staff-dialog'
import { emptyStaffFilters, staffFilterCount } from './staff-filters'
import { staffToCsv } from './staff-export'
import { useStaffCommands } from './use-staff-commands'

export function StaffPage() {
  const { reactivate, resendInvite } = useStaffCommands()
  const canCreate = usePermission('staff:create')
  const canUpdate = usePermission('staff:update')
  const canExport = usePermission('staff:export')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(emptyStaffFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<'asc' | 'desc' | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [suspending, setSuspending] = useState<StaffMember | null>(null)
  const [exporting, setExporting] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const query: StaffQuery = {
    page,
    limit: pageSize,
    search: debouncedSearch,
    status: filters.status,
    roleId: filters.roleId,
    from: filters.from,
    to: filters.to,
    sort: sort ? (sort === 'asc' ? 'name_asc' : 'name_desc') : 'newest',
  }
  const { data, isFetching, isError, refetch } = useGetStaffQuery(query)
  const { data: summary } = useGetStaffSummaryQuery()
  const [fetchAll] = useLazyGetStaffQuery()
  const rows = data?.items ?? []
  const total = data?.total ?? 0

  // Selected rows stay exportable while the admin pages through the list.
  const seen = useRef(new Map<string, StaffMember>())
  useEffect(() => {
    for (const row of data?.items ?? []) seen.current.set(row.id, row)
  }, [data])

  const filterCount = staffFilterCount(filters)
  const hasFilters = !!search || filterCount > 0

  function resetFilters() {
    setSearch('')
    setFilters(emptyStaffFilters)
    setSelected(new Set())
    setPage(1)
  }
  async function exportList() {
    setExporting(true)
    try {
      const list = selected.size
        ? [...selected].flatMap((id) => seen.current.get(id) ?? [])
        : (await fetchAll({ ...query, page: 1, limit: EXPORT_LIMIT }).unwrap()).items
      const url = URL.createObjectURL(
        new Blob(['﻿' + staffToCsv(list)], { type: 'text/csv;charset=utf-8' }),
      )
      Object.assign(document.createElement('a'), {
        href: url,
        download: 'testify-staff-list.csv',
      }).click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success(`${list.length} staff ${list.length === 1 ? 'record' : 'records'} exported`)
    } catch (cause) {
      toast.error(errorMessage(cause, 'Unable to export the staff list.'))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<StaffMember>[] = [
    {
      key: 'sn',
      header: 'S/N',
      width: 60,
      cell: (row) => (page - 1) * pageSize + rows.indexOf(row) + 1,
    },
    {
      key: 'name',
      header: (
        <button
          type="button"
          onClick={() => {
            setSort(sort === 'asc' ? 'desc' : 'asc')
            setPage(1)
          }}
          aria-label={`Sort by name${sort === 'asc' ? ', descending' : ', ascending'}`}
          className="flex items-center gap-2 hover:text-white"
        >
          Name
          <ArrowDownUp className="size-3.5" aria-hidden />
        </button>
      ),
      width: 290,
      cell: (row) => <StaffIdentity staff={row} linked />,
    },
    { key: 'phone', header: 'Phone Number', width: 180, cell: (row) => row.phone || '—' },
    { key: 'role', header: 'Role', width: 190, cell: (row) => row.roleName ?? 'Unassigned' },
    {
      key: 'date',
      header: 'Invite Date',
      width: 140,
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      width: 70,
      cell: (row) => (
        <StaffActions
          staff={row}
          onEdit={canUpdate ? () => setEditing(row) : undefined}
          onSuspend={canUpdate ? () => setSuspending(row) : undefined}
          onReactivate={canUpdate ? () => void reactivate(row) : undefined}
          onResend={canCreate ? () => void resendInvite(row) : undefined}
        />
      ),
    },
  ]

  return (
    <AdminLayout title="Staff Management">
      <section aria-label="Staff totals" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Number of Staff"
          value={summary?.total ?? '—'}
          icon={<Users className="size-8" />}
        />
        <StatCard
          label="Active"
          value={summary?.active ?? '—'}
          icon={<UserCheck className="size-8 text-tf-green" />}
        />
        <StatCard
          label="Inactive"
          value={summary?.inactive ?? '—'}
          icon={<UserX className="size-8 text-tf-red" />}
        />
        <StatCard
          label="Pending"
          value={summary?.pending ?? '—'}
          icon={<UserRoundPlus className="size-8 text-tf-gold" />}
        />
      </section>

      <TableCard
        className="mt-8"
        title="Staff List"
        action={
          <div className="flex flex-wrap items-center gap-4">
            {canExport && (
              <button
                type="button"
                onClick={exportList}
                disabled={exporting || (!total && !selected.size)}
                className={cn(buttonClass.outline, 'h-[46px] px-5 text-[14px]')}
              >
                <Download className="size-[18px]" aria-hidden />
                {exporting ? 'Exporting…' : 'Export List'}
                {selected.size > 0 ? ` (${selected.size})` : ''}
              </button>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={() => setInviting(true)}
                className={cn(buttonClass.primary, 'h-[46px] px-5 text-[14px]')}
              >
                <Plus className="size-[18px]" aria-hidden />
                Add New Staff
              </button>
            )}
          </div>
        }
        footer={
          total > 0 && (
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          )
        }
      >
        <div className="flex flex-wrap items-center gap-4 pb-4 sm:pl-4">
          <SearchField
            aria-label="Search staff"
            placeholder="Search by name or email"
            value={search}
            onValueChange={(next) => {
              setSearch(next)
              setPage(1)
            }}
          />
          <StaffFilters
            value={filters}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
          />
          {filterCount > 0 && (
            <button
              type="button"
              className="text-[14px] text-tf-lime hover:underline"
              onClick={() => {
                setFilters(emptyStaffFilters)
                setPage(1)
              }}
            >
              Reset filters
            </button>
          )}
          {isFetching && (
            <span role="status" className="text-[13px] text-tf-muted">
              Loading…
            </span>
          )}
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          rowLabel={staffName}
          selected={selected}
          onSelectedChange={setSelected}
          emptyMessage={
            isError ? (
              <span>
                We couldn’t load the staff list.{' '}
                <button
                  type="button"
                  className="text-tf-lime underline"
                  onClick={() => void refetch()}
                >
                  Try again
                </button>
              </span>
            ) : !data ? (
              'Loading staff…'
            ) : hasFilters ? (
              <span>
                No staff match your search.{' '}
                <button type="button" className="text-tf-lime underline" onClick={resetFilters}>
                  Clear filters
                </button>
              </span>
            ) : (
              'Your staff list is empty. Add your first staff member to get started.'
            )
          }
        />
      </TableCard>

      <InviteStaffDialog open={inviting} onOpenChange={setInviting} onInvited={resetFilters} />
      {editing && (
        <EditStaffDialog key={editing.id} staff={editing} onClose={() => setEditing(null)} />
      )}
      {suspending && (
        <SuspendStaffDialog
          key={suspending.id}
          staff={suspending}
          onClose={() => setSuspending(null)}
        />
      )}
    </AdminLayout>
  )
}
