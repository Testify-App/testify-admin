import { useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { DataTable, type Column } from '@/components/testify/data-table'
import { SearchField } from '@/components/testify/search-field'
import { TablePagination } from '@/components/testify/table-pagination'
import { buttonClass } from '@/components/testify/button-class'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { usePermission } from '@/features/auth/use-permission'
import { StaffFilters } from '@/features/staff/components/staff-filters'
import { emptyStaffFilters, staffFilterCount } from '@/features/staff/staff-filters'
import { useGetStaffQuery } from '../access-api'
import { formatDate, staffName, type StaffMember } from '../model'
import { InviteStaffDialog } from './invite-staff-dialog'
import { StaffIdentity } from './staff-identity'
import { StatusBadge } from './status-badge'

/**
 * Staff table used while setting up a role (select staff to assign) and on Role Details (staff
 * holding the role, with “Change Role”).
 */
export function AdminPicker({
  value = [],
  onChange,
  assignedOnly = false,
  onChangeRole,
  currentRole,
}: {
  /** Selected staff IDs (selection mode). */
  value?: string[]
  onChange?: (value: string[]) => void
  /** Only list staff holding `currentRole`. */
  assignedOnly?: boolean
  onChangeRole?: (staff: StaffMember) => void
  /** Role new invitations are assigned to. */
  currentRole?: { id: string; name: string }
}) {
  const canInvite = usePermission('staff:create')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(emptyStaffFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [invite, setInvite] = useState(false)
  const debouncedSearch = useDebouncedValue(search)
  const { data, isFetching, isError } = useGetStaffQuery({
    page,
    limit: pageSize,
    search: debouncedSearch,
    status: filters.status,
    roleId: assignedOnly ? currentRole?.id : filters.roleId,
    from: filters.from,
    to: filters.to,
  })
  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const isFiltered = !!search || staffFilterCount(filters) > 0

  const columns: Column<StaffMember>[] = [
    ...(assignedOnly
      ? []
      : [
          {
            key: 'sn',
            header: 'S/N',
            width: 56,
            cell: (row: StaffMember) => (page - 1) * pageSize + rows.indexOf(row) + 1,
          },
        ]),
    { key: 'name', header: 'Name', width: 270, cell: (row) => <StaffIdentity staff={row} /> },
    { key: 'role', header: 'Role', width: 200, cell: (row) => row.roleName ?? '—' },
    { key: 'phone', header: 'Phone Number', width: 175, cell: (row) => row.phone || '—' },
    {
      key: 'date',
      header: 'Invite Date',
      width: 125,
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      width: 125,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    ...(onChangeRole
      ? [
          {
            key: 'action',
            header: 'Action',
            width: 140,
            cell: (row: StaffMember) => (
              <button
                type="button"
                onClick={() => onChangeRole(row)}
                aria-label={`Change role for ${staffName(row)}`}
                className="text-[14px] font-semibold text-tf-lime hover:underline"
              >
                Change Role
              </button>
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
        <div className="flex w-full flex-wrap items-center gap-4 sm:w-auto">
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
            hideRole={assignedOnly}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
          />
          {isFetching && (
            <span role="status" className="text-[13px] text-tf-muted">
              Loading…
            </span>
          )}
        </div>
        {currentRole && canInvite && (
          <button
            type="button"
            className={cn(buttonClass.outline, 'h-[46px] px-5 text-[14px]')}
            onClick={() => setInvite(true)}
          >
            <UserPlus className="size-[18px]" aria-hidden />
            Invite New Staff
          </button>
        )}
      </div>
      {rows.length ? (
        <div className="space-y-4">
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(row) => row.id}
            rowLabel={staffName}
            selectable={!!onChange}
            minWidth={860}
            selected={new Set(value)}
            onSelectedChange={(next) => onChange?.([...next])}
          />
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
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] bg-tf-page px-6 py-[70px] text-center">
          <span className="grid size-20 place-items-center rounded-full bg-tf-card">
            <Users className="size-9 text-tf-dim" aria-hidden />
          </span>
          <h3 className="mt-2 text-[18px] font-semibold">
            {isError
              ? 'We couldn’t load the staff list'
              : !data
                ? 'Loading staff…'
                : isFiltered
                  ? 'No matching staff'
                  : assignedOnly
                    ? 'No admins hold this role yet'
                    : 'Your staff list is empty'}
          </h3>
          <p className="max-w-[390px] text-[14px] leading-6 text-tf-muted">
            {isFiltered
              ? 'Try a different name or email address, or clear the filters.'
              : 'Invite a staff member to this role, or come back later to assign one.'}
          </p>
        </div>
      )}
      <InviteStaffDialog open={invite} onOpenChange={setInvite} currentRole={currentRole} />
    </div>
  )
}
