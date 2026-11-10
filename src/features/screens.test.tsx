import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'

describe('settings', () => {
  beforeEach(() => localStorage.clear())

  it('remembers notification preferences', async () => {
    const { user } = renderApp('/settings')
    const daily = await screen.findByRole('switch', { name: 'Daily summary' })
    expect(daily).toHaveAttribute('aria-checked', 'false')
    await user.click(daily)
    expect(daily).toHaveAttribute('aria-checked', 'true')
    expect(JSON.parse(localStorage.getItem('testify:notification-preferences')!)).toMatchObject({
      dailySummary: true,
    })
  })
})
