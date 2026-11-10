import { DateRangeFields, FilterPopover } from '@/components/testify/filter-popover'
import { SelectField } from '@/components/testify/select-field'
import { cn } from '@/lib/utils'
import type { StaffStatus } from '@/features/roles/model'
import { useRoles } from '@/features/roles/use-access'
import { emptyStaffFilters, staffFilterCount, type StaffFilterValue } from '../staff-filters'

const statusOptions: { value: StaffStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Pending', label: 'Pending' },
]

/** Role, date added and status filters for the staff list. */
export function StaffFilters({
  value,
  onChange,
  hideRole = false,
}: {
  value: StaffFilterValue
  onChange: (value: StaffFilterValue) => void
  /** For lists already limited to one role. */
  hideRole?: boolean
}) {
  const { roles } = useRoles()
  return (
    <FilterPopover
      label="Staff filters"
      value={value}
      onApply={onChange}
      empty={emptyStaffFilters}
      count={staffFilterCount(value)}
      isEqual={(a, b) =>
        a.from === b.from && a.to === b.to && a.status === b.status && a.roleId === b.roleId
      }
      isInvalid={(draft) => !!draft.from && !!draft.to && draft.from > draft.to}
    >
      {(draft, setDraft, id) => (
        <>
          {!hideRole && (
            <div className="py-4">
              <label htmlFor={`${id}-role`} className="mb-3 block text-[14px] font-medium">
                Role
              </label>
              <SelectField
                id={`${id}-role`}
                size="sm"
                value={draft.roleId}
                onValueChange={(roleId) => setDraft({ ...draft, roleId })}
                options={[
                  { value: '', label: 'All roles' },
                  ...roles.map((role) => ({ value: role.id, label: role.name })),
                ]}
              />
            </div>
          )}
          <DateRangeFields
            id={id}
            legend="Date Added"
            from={draft.from}
            to={draft.to}
            onChange={(range) => setDraft({ ...draft, ...range })}
          />
          <fieldset className="py-4">
            <legend className="mb-3 text-[14px] font-medium">Status</legend>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <label
                  key={option.label}
                  className={cn(
                    'cursor-pointer rounded-full border px-4 py-2 text-[13px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tf-lime/60',
                    draft.status === option.value
                      ? 'border-tf-lime bg-tf-lime text-tf-page'
                      : 'border-tf-line text-tf-silver hover:border-tf-outline',
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-status`}
                    value={option.value}
                    checked={draft.status === option.value}
                    onChange={() => setDraft({ ...draft, status: option.value })}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </FilterPopover>
  )
}
