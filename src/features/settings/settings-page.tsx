import { useState } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Panel } from '@/components/testify/panel'
import { Toggle } from '@/components/testify/toggle'

const preferences = [
  {
    key: 'newReports',
    title: 'New report alerts',
    description: 'Get notified when a new report enters the moderation queue.',
  },
  {
    key: 'reviewReminders',
    title: 'Review reminders',
    description: 'Receive a reminder when a report is waiting for your review.',
  },
  {
    key: 'dailySummary',
    title: 'Daily summary',
    description: 'Get a daily overview of moderation activity and resolved reports.',
  },
] as const

type PreferenceKey = (typeof preferences)[number]['key']
const STORAGE_KEY = 'testify:notification-preferences'
const defaults: Record<PreferenceKey, boolean> = {
  newReports: true,
  reviewReminders: true,
  dailySummary: false,
}

function loadPreferences() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return defaults
  }
}

export function SettingsPage() {
  const [values, setValues] = useState<Record<PreferenceKey, boolean>>(loadPreferences)

  const toggle = (key: PreferenceKey, checked: boolean) => {
    const next = { ...values, [key]: checked }
    setValues(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this session.
    }
  }

  return (
    <AdminLayout title="Settings">
      <Panel aria-labelledby="notifications-title" className="max-w-[644px] px-5 pt-[22px] sm:px-8">
        <h2 id="notifications-title" className="text-[24px] leading-8 font-semibold">
          Notifications
        </h2>
        <p className="mt-[14px] text-[16px] leading-6 text-[#5e636c]">
          Choose which moderation updates you receive.
        </p>
        <ul className="mt-[27px]">
          {preferences.map((preference) => (
            <li
              key={preference.key}
              className="flex items-center justify-between gap-6 border-t border-tf-chip py-[34px] last:pb-[26px]"
            >
              <div>
                <p id={`${preference.key}-label`} className="text-[16px] leading-6">
                  {preference.title}
                </p>
                <p className="mt-3 text-[12px] leading-4 text-[#5e636c]">
                  {preference.description}
                </p>
              </div>
              <Toggle
                aria-labelledby={`${preference.key}-label`}
                checked={values[preference.key]}
                onCheckedChange={(checked) => toggle(preference.key, checked)}
              />
            </li>
          ))}
        </ul>
      </Panel>
    </AdminLayout>
  )
}
