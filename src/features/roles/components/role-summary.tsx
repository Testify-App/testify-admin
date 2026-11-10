import { Pencil, ShieldCheck } from 'lucide-react'
import { buttonClass } from '@/components/testify/button-class'
import { cn } from '@/lib/utils'
import { formatDate, type Role } from '../model'
import { StatusBadge } from './status-badge'

export function RoleSummary({
  role,
  onEdit,
}: {
  role: Role
  /** Omitted when the admin may not update roles. */
  onEdit?: () => void
}) {
  const details = [
    ['Number of Admins', role.adminCount],
    ['Number of Permissions', role.permissionCount],
    ['Status', <StatusBadge key="status" status={role.status} />],
    ['Created By', role.createdBy ?? 'System'],
    ['Date Created', formatDate(role.createdAt)],
  ] as const
  return (
    <section aria-label="Role details" className="rounded-[20px] bg-tf-panel p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-[52px] shrink-0 place-items-center rounded-[14px] bg-tf-lime text-tf-page">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[24px] leading-8 font-semibold">{role.name}</h2>
            <p className="mt-1 max-w-[720px] text-[15px] leading-6 text-tf-periwinkle">
              {role.description || 'No description added.'}
            </p>
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            disabled={role.builtIn}
            title={role.builtIn ? 'Built-in role details cannot be changed' : undefined}
            className={cn(buttonClass.outline, 'h-11 px-5 text-[14px]')}
          >
            <Pencil className="size-4" aria-hidden />
            Edit Details
          </button>
        )}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-y-6 rounded-[16px] bg-tf-card py-5 xl:grid-cols-5">
        {details.map(([label, value], index) => (
          <div
            key={label}
            className={cn('min-w-0 px-5 sm:px-7', index > 0 && 'xl:border-l xl:border-tf-line')}
          >
            <dt className="text-[13px] text-tf-muted">{label}</dt>
            <dd className="mt-2 text-[16px] font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
