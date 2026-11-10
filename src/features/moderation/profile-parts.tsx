import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DetailRow, InfoCard, InitialsAvatar } from '@/components/testify/panel'
import { StatusPill, type PillTone } from '@/components/testify/status-pill'
import { cn } from '@/lib/utils'
import type { Standing } from './moderation-api'
import { standingLabel, standingTone } from './report-status'

const outcomeTones: Record<string, PillTone> = {
  pending: 'pending',
  'under review': 'review',
  resolved: 'published',
  reported: 'pending',
  published: 'published',
  'content removed': 'removed',
  'no action': 'neutral',
  'warning issued': 'warning',
  'account suspended': 'warning',
  'account banned': 'removed',
}

/** Status pill for report outcomes and content states (“Pending”, “Content removed”…). */
export function OutcomePill({
  children,
  className,
  muted = false,
}: {
  children: string
  className?: string
  /** Show closed outcomes in neutral grey (reporter submission history). */
  muted?: boolean
}) {
  const tone = outcomeTones[children.toLowerCase()] ?? 'neutral'
  const open = tone === 'pending' || tone === 'review'
  return (
    <StatusPill tone={muted && !open ? 'neutral' : tone} className={className}>
      {children}
    </StatusPill>
  )
}

export function ProfileIntro({
  crumbs,
  title,
  description,
}: {
  crumbs: Array<{ label: string; to?: string }>
  title: string
  description: string
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[13px] leading-4 text-tf-muted">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.label}>
            {index > 0 && <span className="mx-[7px]">/</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="hover:text-white">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </Fragment>
        ))}
      </nav>
      <h2 className="mt-[19px] text-[24px] leading-8 font-semibold">{title}</h2>
      <p className="mt-[17px] text-[15px] leading-5 text-tf-muted">{description}</p>
    </>
  )
}

export interface ProfilePerson {
  name: string
  username: string | null
  standing: Standing
}

export function ProfileSummary({
  member,
  subtitle,
  stats,
}: {
  member: ProfilePerson
  subtitle: ReactNode
  stats: Array<{ value: ReactNode; label: string }>
}) {
  return (
    <section
      aria-label="Profile summary"
      className="mt-[35px] flex flex-wrap items-center gap-6 rounded-[20px] border border-tf-line bg-tf-card px-5 py-6 sm:px-[31px] lg:h-[136px] lg:flex-nowrap lg:py-0"
    >
      <InitialsAvatar name={member.name} className="size-[72px] text-[22px]" />
      <div className="min-w-0 flex-1">
        <p className="text-[26px] leading-8 font-semibold">{member.name}</p>
        <p className="mt-[11px] text-[16px] leading-5 text-tf-silver">
          @{member.username} <span className="mx-[6px]">·</span> {subtitle}
        </p>
      </div>
      <dl className="flex gap-10 lg:mr-[-24px] lg:w-[528px] lg:gap-0">
        {stats.map((stat) => (
          <div key={stat.label} className="lg:w-[176px]">
            <dd className="text-[26px] leading-8 font-semibold">{stat.value}</dd>
            <dt className="mt-[10px] text-[14px] leading-5 text-tf-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
      <StatusPill dot tone={standingTone[member.standing]} className="h-[33px] px-4">
        {standingLabel[member.standing]}
      </StatusPill>
    </section>
  )
}

/** Centre-to-centre row spacing per group, as drawn in both profile mockups. */
const rowGaps = [
  [52, 40, 40],
  [52, 52],
]

/** “Account overview” card: grouped label/value lists indented inside the card. */
export function AccountOverview({
  groups,
}: {
  groups: Array<{ heading: string; rows: Array<{ label: string; value: ReactNode }> }>
}) {
  return (
    <InfoCard title="Account overview">
      <div className="px-0 pt-[34px] pb-[5px] sm:px-6">
        {groups.map((group, groupIndex) => (
          <div key={group.heading} className="mt-7 first:mt-0">
            <h3 className="text-[14px] leading-5 font-medium">{group.heading}</h3>
            <dl className="mt-7">
              {group.rows.map((row, rowIndex) => (
                <DetailRow
                  key={row.label}
                  label={row.label}
                  style={{
                    // Gap minus the 20px row line-height; extra rows fall back to 40px spacing.
                    marginTop: rowIndex && (rowGaps[groupIndex]?.[rowIndex - 1] ?? 40) - 20,
                  }}
                >
                  {row.value}
                </DetailRow>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </InfoCard>
  )
}

export function AccountStatusText({ standing }: { standing: Standing }) {
  return (
    <span
      className={cn(
        standing === 'active'
          ? 'text-tf-green'
          : standing === 'banned'
            ? 'text-tf-red'
            : 'text-tf-gold',
      )}
    >
      {standingLabel[standing]}
    </span>
  )
}

export function FooterNote({ children }: { children: ReactNode }) {
  return <p className="mt-[37px] text-[13px] leading-5 text-[#484e5a]">{children}</p>
}
