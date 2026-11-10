import { errorClass, fieldClass, labelClass, textareaClass } from '@/components/testify/form-styles'
import { cn } from '@/lib/utils'
import { ROLE_DESCRIPTION_MAX, type RoleDraft } from '../model'

/** Characters left at which the counter starts warning. */
const NEAR_LIMIT = 50

export function RoleFields({
  value,
  onChange,
  error,
  descriptionError,
}: {
  value: Pick<RoleDraft, 'name' | 'description'>
  onChange: (value: Pick<RoleDraft, 'name' | 'description'>) => void
  error?: string
  descriptionError?: string
}) {
  const remaining = ROLE_DESCRIPTION_MAX - value.description.length
  const nearLimit = remaining <= NEAR_LIMIT
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="role-name" className={labelClass}>
          Role Name
        </label>
        <input
          id="role-name"
          autoFocus
          maxLength={80}
          placeholder="Enter title"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          aria-invalid={!!error}
          aria-describedby={error ? 'role-name-error' : undefined}
          className={fieldClass}
        />
        {error && (
          <p id="role-name-error" role="alert" className={errorClass}>
            {error}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="role-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="role-description"
          rows={5}
          maxLength={ROLE_DESCRIPTION_MAX}
          placeholder="Describe the responsibility of this role"
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          aria-invalid={!!descriptionError}
          aria-describedby={[descriptionError && 'role-description-error', 'role-description-count']
            .filter(Boolean)
            .join(' ')}
          className={cn(textareaClass, 'h-[150px]')}
        />
        <div className="mt-2 flex items-start justify-between gap-3 text-[12px]">
          {descriptionError ? (
            <p id="role-description-error" role="alert" className="text-[#f97066]">
              {descriptionError}
            </p>
          ) : nearLimit ? (
            <p aria-live="polite" className="text-tf-gold">
              {remaining === 0
                ? `You have reached the ${ROLE_DESCRIPTION_MAX}-character limit.`
                : `${remaining} ${remaining === 1 ? 'character' : 'characters'} left.`}
            </p>
          ) : (
            <span />
          )}
          <p
            id="role-description-count"
            className={cn('shrink-0 tabular-nums', nearLimit ? 'text-tf-gold' : 'text-tf-dim')}
          >
            {value.description.length}/{ROLE_DESCRIPTION_MAX}
          </p>
        </div>
      </div>
    </div>
  )
}
