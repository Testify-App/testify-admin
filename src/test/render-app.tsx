import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { createAppStore } from '@/app/store'
import { AppRoutes } from '@/app/router'
import { signedIn, type Session } from '@/app/session-slice'

export const testSession: Session = {
  token: 'test-token',
  user: { id: 'admin-test', name: 'Test Admin', email: 'admin@example.com' },
}

/** Renders the full app at `path`, signed in as `session` unless `signedIn` is false. */
export function renderApp(
  path: string,
  {
    signedIn: withSession = true,
    session = testSession,
  }: { signedIn?: boolean; session?: Session } = {},
) {
  sessionStorage.clear()
  const { store, persistor } = createAppStore()
  persistor.pause()
  if (withSession) store.dispatch(signedIn(session))
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  )
  return { store, user: userEvent.setup() }
}
