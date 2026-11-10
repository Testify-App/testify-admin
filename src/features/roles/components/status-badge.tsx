import { StatusPill, type PillTone } from '@/components/testify/status-pill'
import type { AccessStatus } from '../filters'

const accessStatusTone: Record<AccessStatus, PillTone> = {
  Active: 'active',
  Inactive: 'removed',
  Pending: 'pending',
}

/** Role and staff status pill. */
export function StatusBadge({
  status,
  label = status,
  className,
}: {
  status: AccessStatus
  label?: string
  className?: string
}) {
  return (
    <StatusPill tone={accessStatusTone[status]} dot className={className ?? 'h-7 px-3'}>
      {label}
    </StatusPill>
  )
}
