import { useState, type ReactNode } from 'react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Design width in px; columns scale proportionally on narrower screens. */
  width: number
  className?: string
}

/** Square outline checkbox from the table designs. */
export function TableCheckbox(props: CheckboxPrimitive.CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      {...props}
      className="peer grid size-4 shrink-0 place-items-center rounded-[4px] border-[1.5px] border-[#c6c6c6] text-tf-page outline-none focus-visible:ring-2 focus-visible:ring-tf-lime/60 data-[state=checked]:border-tf-lime data-[state=checked]:bg-tf-lime data-[state=indeterminate]:border-tf-lime data-[state=indeterminate]:bg-tf-lime"
    >
      <CheckboxPrimitive.Indicator>
        {props.checked === 'indeterminate' ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <Check className="size-3" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

/**
 * Table on the dark `#0b0f14` well: an inset rounded header row, 61px rows with full-width
 * dividers and a leading selection checkbox column.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowLabel,
  emptyMessage = 'Nothing to show yet.',
  className,
  selectable = true,
  minWidth = 960,
  selected: controlled,
  onSelectedChange,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  /** Accessible name for a row's checkbox. */
  rowLabel: (row: T) => string
  emptyMessage?: ReactNode
  className?: string
  /** False hides the leading checkbox column. */
  selectable?: boolean
  /** Below this width (px) the table scrolls horizontally. */
  minWidth?: number
  /** Controlled selection (keys from `rowKey`); uncontrolled when omitted. */
  selected?: Set<string>
  onSelectedChange?: (selected: Set<string>) => void
}) {
  const [internal, setInternal] = useState<Set<string>>(new Set())
  const selected = controlled ?? internal
  const setSelected = (update: (current: Set<string>) => Set<string>) => {
    const next = update(selected)
    if (!controlled) setInternal(next)
    onSelectedChange?.(next)
  }
  const keys = rows.map(rowKey)
  const selectedCount = keys.filter((key) => selected.has(key)).length
  const allState =
    selectedCount === 0 ? false : selectedCount === keys.length ? true : ('indeterminate' as const)
  const checkboxWidth = selectable ? 96 : 30
  const total = checkboxWidth + columns.reduce((sum, column) => sum + column.width, 0)
  const pct = (width: number) => `${(width / total) * 100}%`

  return (
    <div className={cn('overflow-x-auto rounded-[16px] bg-tf-page pt-4 pb-[26px]', className)}>
      <table
        style={{ minWidth }}
        className="w-full table-fixed border-separate border-spacing-0 text-left"
      >
        <colgroup>
          <col className="w-[15px]" />
          <col style={{ width: pct(checkboxWidth) }} />
          {columns.map((column) => (
            <col key={column.key} style={{ width: pct(column.width) }} />
          ))}
          <col className="w-[15px]" />
        </colgroup>
        <thead>
          <tr className="text-[16px] font-normal text-[#a7a9ae] [&>th]:border-b-[3px] [&>th]:border-transparent [&>th]:bg-clip-padding [&>th]:font-normal">
            <th aria-hidden className="h-[53px] p-0" />
            <th className="rounded-l-[12px] bg-tf-field pl-[42px]">
              {selectable && (
                <TableCheckbox
                  aria-label="Select all rows"
                  checked={allState}
                  disabled={rows.length === 0}
                  onCheckedChange={(value) =>
                    setSelected((current) => {
                      const next = new Set(current)
                      for (const key of keys) {
                        if (value === true) next.add(key)
                        else next.delete(key)
                      }
                      return next
                    })
                  }
                />
              )}
            </th>
            {columns.map((column, index) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'bg-tf-field pr-3',
                  index === columns.length - 1 && 'rounded-r-[12px]',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
            <th aria-hidden className="p-0" />
          </tr>
        </thead>
        <tbody className="text-[16px] text-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 3} className="h-[122px] text-center text-tf-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => {
              const key = rowKey(row)
              const divider = rowIndex < rows.length - 1 ? 'border-b border-tf-rule' : 'border-b-0'
              return (
                <tr key={key} className="group">
                  <td className={cn('h-[61px] p-0', divider)} />
                  <td className={cn('pl-[42px]', divider)}>
                    {selectable && (
                      <TableCheckbox
                        aria-label={`Select ${rowLabel(row)}`}
                        checked={selected.has(key)}
                        onCheckedChange={(value) =>
                          setSelected((current) => {
                            const next = new Set(current)
                            if (value === true) next.add(key)
                            else next.delete(key)
                            return next
                          })
                        }
                      />
                    )}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('truncate pr-3 whitespace-nowrap', divider, column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  <td className={cn('p-0', divider)} />
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Panel holding a table: 76px title band, 16px inset well and an optional footer. */
export function TableCard({
  title,
  action,
  footer,
  children,
  className,
  ...props
}: {
  title?: ReactNode
  action?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  'aria-label'?: string
}) {
  return (
    <section
      className={cn('rounded-[20px] bg-tf-panel px-4 pb-4', footer && 'pb-[15px]', className)}
      {...props}
    >
      <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3 sm:pl-4">
        {typeof title === 'string' ? (
          <h2 className="text-[24px] leading-8 font-semibold">{title}</h2>
        ) : (
          title
        )}
        {action}
      </div>
      {children}
      {footer && <div className="pt-[17px]">{footer}</div>}
    </section>
  )
}
