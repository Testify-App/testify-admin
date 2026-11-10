import { Check, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const roleSteps = [
  {
    title: 'Add Details',
    description:
      'Add a name and a short description that better explains the responsibility of the role.',
  },
  { title: 'Set Permissions', description: 'Choose what this role can view and manage.' },
  { title: 'Add Admin', description: 'Assign staff members to this role.' },
]

/** Vertical progress for the Add Role flow; completed steps can be revisited. */
export function StepNavigation({
  step,
  onStepChange,
  compact = false,
}: {
  step: number
  onStepChange: (step: number) => void
  /** Inside the details sheet: hides the descriptions on small screens. */
  compact?: boolean
}) {
  return (
    <div>
      <ol className={cn(compact && 'max-sm:flex max-sm:justify-between max-sm:gap-2')}>
        {roleSteps.map((item, index) => (
          <li
            key={item.title}
            className={cn(
              "relative pb-7 not-last:before:absolute not-last:before:top-[34px] not-last:before:bottom-[6px] not-last:before:left-[13px] not-last:before:w-0.5 not-last:before:rounded-full not-last:before:content-['']",
              index < step ? 'not-last:before:bg-tf-lime' : 'not-last:before:bg-tf-line',
              compact && 'max-sm:pb-0 max-sm:before:hidden',
            )}
          >
            <button
              type="button"
              disabled={index > step}
              onClick={() => onStepChange(index)}
              aria-current={index === step ? 'step' : undefined}
              className="flex w-full items-start gap-3 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full',
                  index > step ? 'border-2 border-tf-line bg-tf-panel' : 'bg-tf-lime text-tf-page',
                )}
              >
                {index < step ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      index > step ? 'bg-tf-line' : 'bg-tf-page',
                    )}
                  />
                )}
              </span>
              <span className="min-w-0 pt-[3px]">
                <strong
                  className={cn(
                    'block text-[15px] leading-5 font-semibold',
                    index === step ? 'text-tf-lime' : index > step ? 'text-tf-dim' : 'text-white',
                    compact && 'max-sm:text-[12px]',
                  )}
                >
                  {item.title}
                </strong>
                <span
                  className={cn(
                    'mt-1 block text-[13px] leading-5',
                    index > step ? 'text-tf-dim' : 'text-tf-muted',
                    compact && 'max-sm:hidden',
                  )}
                >
                  {item.description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div
        className={cn(
          'mt-2 flex gap-3 rounded-[16px] border border-tf-gold/40 bg-[#2d2b18] p-4 text-tf-gold',
          compact && 'max-sm:hidden',
        )}
      >
        <Lightbulb className="size-5 shrink-0" aria-hidden />
        <div>
          <strong className="text-[14px] font-semibold">Need to make changes?</strong>
          <p className="mt-1 text-[12px] leading-[18px] text-tf-gold/80">
            Click any completed step to go back.
          </p>
        </div>
      </div>
    </div>
  )
}
