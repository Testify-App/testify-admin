import { DateRangeFields, FilterPopover } from '@/components/testify/filter-popover'
import { TableCheckbox } from '@/components/testify/data-table'
import {
  emptyStatusFilters,
  statusFilterCount,
  type AccessStatus,
  type StatusFilterValue,
} from '../filters'
import { StatusBadge } from './status-badge'

const sameFilters = (a: StatusFilterValue, b: StatusFilterValue) =>
  a.from === b.from &&
  a.to === b.to &&
  a.statuses.length === b.statuses.length &&
  a.statuses.every((status) => b.statuses.includes(status))

/** Date range and multi-status filter used on the roles grid and the role's admin list. */
export function StatusFilters({
  value,
  onChange,
  options = ['Active', 'Inactive'],
}: {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
  options?: readonly AccessStatus[]
}) {
  return (
    <FilterPopover
      value={value}
      onApply={onChange}
      empty={emptyStatusFilters}
      count={statusFilterCount(value)}
      isEqual={sameFilters}
      isInvalid={(draft) => !!draft.from && !!draft.to && draft.from > draft.to}
    >
      {(draft, setDraft, id) => (
        <>
          <DateRangeFields
            id={id}
            legend="Date Range"
            from={draft.from}
            to={draft.to}
            onChange={(range) => setDraft({ ...draft, ...range })}
          />
          <fieldset className="py-4">
            <div className="mb-3 flex items-center justify-between">
              <legend className="text-[14px] font-medium">Status</legend>
              <button
                type="button"
                className="text-[13px] text-tf-lime hover:underline"
                onClick={() => setDraft({ ...draft, statuses: [...options] })}
              >
                Select all
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {options.map((status) => (
                <label key={status} className="flex cursor-pointer items-center gap-2">
                  <TableCheckbox
                    aria-label={status}
                    checked={draft.statuses.includes(status)}
                    onCheckedChange={(checked) =>
                      setDraft({
                        ...draft,
                        statuses:
                          checked === true
                            ? [...draft.statuses, status]
                            : draft.statuses.filter((item) => item !== status),
                      })
                    }
                  />
                  <StatusBadge status={status} />
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </FilterPopover>
  )
}
