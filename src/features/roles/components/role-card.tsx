import { Link } from 'react-router-dom'
import { Ellipsis, Eye, KeyRound, Power, Trash2, Users } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { menuContentClass, menuItemClass } from '@/components/testify/form-styles'
import { cn } from '@/lib/utils'
import { formatDate, type Role } from '../model'
import { StatusBadge } from './status-badge'

export function RoleCard({
  role,
  onDelete,
  onStatusChange,
}: {
  role: Role
  /** Omitted when the admin may not delete roles. */
  onDelete?: () => void
  /** Omitted when the admin may not update roles. */
  onStatusChange?: () => void
}) {
  return (
    <article className="flex flex-col rounded-[20px] border border-tf-line bg-tf-card p-2 transition-colors hover:border-tf-lime/40">
      <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-3">
        <Link
          to={`/roles/${role.id}`}
          className="truncate text-[18px] leading-6 font-semibold hover:text-tf-lime"
        >
          {role.name}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Options for ${role.name}`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-white hover:bg-white/10"
          >
            <Ellipsis className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(menuContentClass, 'w-[200px] p-1.5')}>
            <DropdownMenuItem asChild className={menuItemClass}>
              <Link to={`/roles/${role.id}`}>
                <Eye />
                View Details
              </Link>
            </DropdownMenuItem>
            {!role.builtIn && onStatusChange && (
              <DropdownMenuItem onSelect={onStatusChange} className={menuItemClass}>
                <Power />
                {role.status === 'Active' ? 'Deactivate' : 'Activate'} Role
              </DropdownMenuItem>
            )}
            {!role.builtIn && onDelete && (
              <DropdownMenuItem
                onSelect={onDelete}
                className={cn(menuItemClass, 'text-tf-red focus:text-tf-red [&_svg]:text-tf-red')}
              >
                <Trash2 />
                Delete Role
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-1 flex-col gap-4 rounded-[16px] bg-tf-panel p-4">
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className="flex items-center gap-2 text-tf-silver">
            <span className="grid size-7 place-items-center rounded-[8px] bg-[#2d2b18] text-tf-gold">
              <KeyRound className="size-3.5" aria-hidden />
            </span>
            {role.permissionCount} {role.permissionCount === 1 ? 'Permission' : 'Permissions'}
          </span>
          <StatusBadge status={role.status} />
        </div>
        <p className="line-clamp-2 min-h-10 text-[14px] leading-5 text-tf-muted">
          {role.description || 'No description added.'}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-tf-line pt-3 text-[13px] text-tf-silver">
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-tf-stat text-tf-lavender">
              <Users className="size-3.5" aria-hidden />
            </span>
            {role.adminCount === 1 ? '1 Admin' : `${role.adminCount} Admins`}
          </span>
          <span title={`Created by ${role.createdBy ?? 'System'}`}>
            {formatDate(role.createdAt)}
          </span>
        </div>
      </div>
    </article>
  )
}
