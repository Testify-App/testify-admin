import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Hourglass } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { TableCard } from '@/components/testify/data-table'
import { StatCard } from '@/components/testify/stat-card'
import { Pagination } from '@/components/testify/pagination'
import { useAppSelector } from '@/app/store'
import {
  useGetModerationSummaryQuery,
  useGetReportsQuery,
} from '@/features/moderation/moderation-api'
import { ReportsTable } from '@/features/moderation/reports-table'

function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Solid eye from the “Under Review” tile. */
function EyeGlyph() {
  return (
    <svg viewBox="0 0 44 30" className="h-[30px] w-11" fill="currentColor">
      <path d="M22 0C11.5 0 3.6 6.6 0 15c3.6 8.4 11.5 15 22 15s18.4-6.6 22-15C40.4 6.6 32.5 0 22 0Z" />
      <circle cx="22" cy="15" r="8.5" fill="var(--color-tf-stat)" />
      <circle cx="22" cy="15" r="5" />
    </svg>
  )
}

/** Solid shield with a check from the “Actions Taken” tile. */
function ShieldGlyph() {
  return (
    <svg viewBox="0 0 36 42" className="h-[42px] w-9">
      <path
        d="M18 0 0 6.5v12.3C0 30 7.7 38.6 18 42c10.3-3.4 18-12 18-23.2V6.5L18 0Z"
        fill="currentColor"
      />
      <path
        d="m10.5 21 5.2 5.2 10-10.2"
        fill="none"
        stroke="var(--color-tf-stat)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function OverviewPage() {
  const name = useAppSelector((state) => state.auth.session?.user.name ?? '')
  const [page, setPage] = useState(1)
  const { data: summary } = useGetModerationSummaryQuery()
  const { data: recent, isFetching, isError } = useGetReportsQuery({ page, limit: 7 })
  const stat = (value: number | undefined) => value ?? '—'
  const firstName = name.split(' ')[0] || 'there'

  return (
    <AdminLayout
      eyebrow="Admin Console / Moderation"
      title={
        <>
          {greeting()}, <span className="text-tf-lime">{firstName}</span>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:mt-2 xl:grid-cols-4 xl:gap-8">
        <StatCard
          label="Pending Reports"
          value={stat(summary?.pending)}
          icon={<Hourglass className="size-[42px]" fill="currentColor" strokeWidth={1.75} />}
        />
        <StatCard label="Under Review" value={stat(summary?.underReview)} icon={<EyeGlyph />} />
        <StatCard
          label="Resolved"
          value={stat(summary?.resolved)}
          icon={
            <span className="grid size-10 place-items-center rounded-full bg-white">
              <Check className="size-6 text-tf-stat" strokeWidth={3} />
            </span>
          }
        />
        <StatCard
          label="Actions Taken"
          value={stat(summary?.actionsTaken)}
          icon={<ShieldGlyph />}
        />
      </div>

      <TableCard
        className="mt-8 lg:mt-[33px]"
        title="Recent Reports"
        action={
          <Link
            to="/moderation"
            className="flex items-center gap-[14px] pr-4 text-[16px] font-semibold text-tf-lime"
          >
            <span className="underline underline-offset-4">View All Reports</span>
            <ArrowRight className="size-5" strokeWidth={2.25} aria-hidden />
          </Link>
        }
        footer={
          recent && recent.totalPages > 1 ? (
            <Pagination
              tone="lavender"
              page={page}
              totalPages={recent.totalPages}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        <ReportsTable rows={recent?.items ?? []} loading={isFetching && !recent} error={isError} />
      </TableCard>
    </AdminLayout>
  )
}
