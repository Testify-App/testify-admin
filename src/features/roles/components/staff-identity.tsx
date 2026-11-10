import { Link } from 'react-router-dom'
import { initials } from '@/lib/utils'
import { staffName, type StaffMember } from '../model'

/** Initials avatar with name and email; links to the staff profile when `linked`. */
export function StaffIdentity({ staff, linked = false }: { staff: StaffMember; linked?: boolean }) {
  const name = staffName(staff)
  const content = (
    <>
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-tf-lavender text-[12px] font-semibold text-tf-panel"
      >
        {initials(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] leading-5">{name}</span>
        <span className="block truncate text-[12px] leading-4 text-tf-muted">{staff.email}</span>
      </span>
    </>
  )
  return linked ? (
    <Link to={`/staff/${staff.id}`} className="flex min-w-0 items-center gap-3 hover:text-tf-lime">
      {content}
    </Link>
  ) : (
    <span className="flex min-w-0 items-center gap-3">{content}</span>
  )
}
