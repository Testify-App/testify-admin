import { TableCheckbox } from '@/components/testify/data-table'
import { Toggle } from '@/components/testify/toggle'
import { cn } from '@/lib/utils'
import { permissionActions, permissions } from '../model'

// Grouped in catalogue order; not every module offers every action.
const modules = [...new Set(permissions.map((permission) => permission.category))].map(
  (category) => ({
    category,
    byAction: new Map(
      permissions
        .filter((permission) => permission.category === category)
        .map((permission) => [permission.action, permission.id]),
    ),
  }),
)
const allIds = permissions.map((permission) => permission.id)

/** Module × action permission matrix with a per-module “All” toggle. */
export function PermissionTable({
  value,
  onChange,
  readOnly = false,
  showHeading = true,
  showSelectAll = true,
  className,
}: {
  /** Selected permission IDs. */
  value: string[]
  onChange?: (value: string[]) => void
  readOnly?: boolean
  showHeading?: boolean
  showSelectAll?: boolean
  className?: string
}) {
  const selected = value.filter((id) => allIds.includes(id))
  const toggle = (id: string, checked: boolean) =>
    onChange?.(checked ? [...new Set([...value, id])] : value.filter((item) => item !== id))
  return (
    <section className={className}>
      {showHeading && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <h3 className="text-[20px] leading-7 font-semibold">
            Permissions <span className="text-tf-lime">({selected.length})</span>
          </h3>
          {!readOnly && showSelectAll && (
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-tf-muted">
              <TableCheckbox
                aria-label="Select all permissions"
                checked={
                  selected.length === allIds.length
                    ? true
                    : selected.length
                      ? 'indeterminate'
                      : false
                }
                onCheckedChange={(checked) => onChange?.(checked === true ? [...allIds] : [])}
              />
              Select all
            </label>
          )}
        </div>
      )}
      <div className="overflow-x-auto rounded-[16px] bg-tf-page px-[15px] pt-4 pb-4">
        <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-0 text-left">
          <colgroup>
            <col className="w-[28%]" />
          </colgroup>
          <thead>
            <tr className="text-[14px] text-[#a7a9ae] [&>th]:h-[53px] [&>th]:bg-tf-field [&>th]:font-normal">
              <th scope="col" className="rounded-l-[12px] pl-6">
                Module
              </th>
              {permissionActions.map((action) => (
                <th key={action} scope="col" className="text-center">
                  {action}
                </th>
              ))}
              <th scope="col" className="rounded-r-[12px] text-center">
                All
              </th>
            </tr>
          </thead>
          <tbody className="text-[15px] text-white">
            {modules.map(({ category, byAction }, index) => {
              const ids = [...byAction.values()]
              const divider = index < modules.length - 1 && 'border-b border-tf-rule'
              return (
                <tr key={category} className="[&>td]:h-[61px]">
                  <td className={cn('pl-6 font-medium', divider)}>{category}</td>
                  {permissionActions.map((action) => {
                    const id = byAction.get(action)
                    return (
                      <td key={action} className={cn('text-center', divider)}>
                        {id ? (
                          <Toggle
                            aria-label={`${category}: ${action}`}
                            checked={value.includes(id)}
                            disabled={readOnly}
                            onCheckedChange={(checked) => toggle(id, checked)}
                            className="align-middle"
                          />
                        ) : (
                          <span
                            className="text-tf-dim"
                            aria-label={`${category}: ${action} not available`}
                          >
                            —
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className={cn('text-center', divider)}>
                    <Toggle
                      aria-label={`All ${category} permissions`}
                      disabled={readOnly}
                      checked={ids.every((id) => value.includes(id))}
                      onCheckedChange={(checked) =>
                        onChange?.(
                          checked
                            ? [...new Set([...value, ...ids])]
                            : value.filter((id) => !ids.includes(id)),
                        )
                      }
                      className="align-middle"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
