import type { ReactNode } from 'react'

/** Navy count tile from the Overview design. */
export function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon: ReactNode
}) {
  return (
    <div className="flex h-[116px] items-center justify-between rounded-[20px] bg-tf-stat pr-[30px] pl-[27px]">
      <div>
        <p className="text-[16px] leading-5 text-[#e9edf7]">{label}</p>
        <p className="mt-[9px] text-[28px] leading-8 font-bold">{value}</p>
      </div>
      <span aria-hidden className="text-white">
        {icon}
      </span>
    </div>
  )
}
