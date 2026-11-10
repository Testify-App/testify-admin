import { useState } from 'react'
import { FileOutput } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { TableCard } from '@/components/testify/data-table'
import { Pagination } from '@/components/testify/pagination'
import { SelectField, type Option } from '@/components/testify/select-field'
import { buttonClass } from '@/components/testify/button-class'
import { useDownload } from '@/lib/api/download'
import { cn } from '@/lib/utils'
import { BACKOFFICE } from '@/features/auth/auth-api'
import { usePermission } from '@/features/auth/use-permission'
import {
  reportParams,
  useGetReportsQuery,
  type ReportStatus,
} from '@/features/moderation/moderation-api'
import { ReportsTable } from '@/features/moderation/reports-table'

const statusOptions: Option[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
]

export function ReportsPage() {
  const canExport = usePermission('reports:export')
  const download = useDownload()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const filters = { status: status as ReportStatus | '' }
  const { data, isFetching, isError } = useGetReportsQuery({ ...filters, page, limit: 10 })
  return (
    <AdminLayout title="Reports">
      <TableCard
        title={`All reports${data ? ` (${data.total})` : ''}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <SelectField
              aria-label="Filter by status"
              size="sm"
              className="w-[170px]"
              options={statusOptions}
              value={status}
              onValueChange={(value) => {
                setStatus(value)
                setPage(1)
              }}
            />
            {canExport && (
              <button
                type="button"
                onClick={() =>
                  void download(
                    `${BACKOFFICE}/moderation/reports/export`,
                    reportParams(filters),
                    'testify-reports.csv',
                  )
                }
                className={cn(buttonClass.outline, 'h-[46px] gap-2 px-5 text-[14px]')}
              >
                <FileOutput className="size-[18px]" aria-hidden />
                Export CSV
              </button>
            )}
          </div>
        }
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
