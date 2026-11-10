import { Link } from 'react-router-dom'
import { CircleCheck, EllipsisVertical, Eye, OctagonAlert, Pencil, Send } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { menuContentClass, menuItemClass } from '@/components/testify/form-styles'
import { cn } from '@/lib/utils'
import { staffName, type StaffMember } from '@/features/roles/model'
import { useIsOwnAccount } from '@/features/roles/use-access'

/** Row menu: view, edit, suspend / reactivate and resend invite. */
export function StaffActions({
  staff,
  onEdit,
  onSuspend,
  onReactivate,
  onResend,
}: {
  staff: StaffMember
  /** Each action is omitted when the admin lacks the permission for it. */
  onEdit?: () => void
  onSuspend?: () => void
  onReactivate?: () => void
  onResend?: () => void
}) {
  const ownAccount = useIsOwnAccount(staff)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${staffName(staff)}`}
        className="grid size-9 place-items-center rounded-full border border-tf-line text-white hover:bg-white/10"
      >
        <EllipsisVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn(menuContentClass, 'w-[210px] p-1.5')}>
        <DropdownMenuItem asChild className={menuItemClass}>
          <Link to={`/staff/${staff.id}`}>
            <Eye />
            View Details
          </Link>
        </DropdownMenuItem>
        {onEdit && (
          <>
            <DropdownMenuSeparator className="bg-tf-line" />
            <DropdownMenuItem onSelect={onEdit} className={menuItemClass}>
              <Pencil />
              Edit Admin
            </DropdownMenuItem>
          </>
        )}
        {onResend && staff.status === 'Pending' && (
          <>
            <DropdownMenuSeparator className="bg-tf-line" />
            <DropdownMenuItem onSelect={onResend} className={menuItemClass}>
              <Send />
              Resend Invite
            </DropdownMenuItem>
          </>
        )}
        {onSuspend && !ownAccount && !staff.isRoot && staff.status === 'Active' && (
          <>
            <DropdownMenuSeparator className="bg-tf-line" />
            <DropdownMenuItem
              onSelect={onSuspend}
              className={cn(menuItemClass, 'text-tf-red focus:text-tf-red [&_svg]:text-tf-red')}
            >
              <OctagonAlert />
              Suspend Admin
            </DropdownMenuItem>
          </>
        )}
        {onReactivate && staff.status === 'Inactive' && (
          <>
            <DropdownMenuSeparator className="bg-tf-line" />
            <DropdownMenuItem
              onSelect={onReactivate}
              className={cn(
                menuItemClass,
                'text-tf-green focus:text-tf-green [&_svg]:text-tf-green',
              )}
            >
              <CircleCheck />
              Reactivate Admin
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
