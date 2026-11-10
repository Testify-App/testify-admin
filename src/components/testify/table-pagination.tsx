import { useId } from 'react'
import { Pagination } from './pagination'
import { SelectField } from './select-field'

const sizes = [10, 25, 50]

/** Rows-per-page selector, range summary and page buttons under a table. */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const id = useId()
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-1 text-[13px] text-tf-muted sm:px-4">
      <div className="flex items-center gap-4">
        <label htmlFor={id} className="whitespace-nowrap">
          Rows per page
        </label>
        <SelectField
          id={id}
          size="sm"
          className="w-[96px]"
          options={sizes.map((size) => ({ value: String(size), label: String(size) }))}
          value={String(pageSize)}
          onValueChange={(next) => onPageSizeChange(Number(next))}
        />
        <span>
          Showing {total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} of{' '}
          {total}
        </span>
      </div>
      <Pagination tone="lime" page={page} totalPages={pages} onPageChange={onPageChange} />
    </div>
  )
}
