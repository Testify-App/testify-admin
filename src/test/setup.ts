import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './server'
import { resetBackoffice } from './backoffice-mock'
import { resetModeration } from './moderation-mock'

window.scrollTo = vi.fn()
// jsdom has no layout; the one-time-code input probes it.
document.elementFromPoint = vi.fn(() => null)
// Lazy routes plus mocked API round-trips can exceed the 1s default under a parallel run.
configure({ asyncUtilTimeout: 5000 })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetBackoffice()
  resetModeration()
})
afterAll(() => server.close())

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
