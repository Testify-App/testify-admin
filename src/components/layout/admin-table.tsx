import type { ComponentProps } from 'react'
import { Table } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function AdminTable({ className, ...props }: ComponentProps<typeof Table>) {
  return (
    <Table
      {...props}
      className={cn(
        '[&_th]:bg-[#f8f9fb] [&_th]:font-medium [&_th]:text-[#667085] [&_th]:text-xs [&_th]:px-3 [&_th]:py-[18px] [&_td]:h-16 [&_td]:p-3 [&_td]:text-[13px] [&_td]:border-[#eeeef1]',
        className,
      )}
    />
  )
}
