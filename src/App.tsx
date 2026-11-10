import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Toaster } from 'sonner'
import { setupListeners } from '@reduxjs/toolkit/query'
import { createAppStore } from './app/store'
import { AppRoutes, LoadingScreen } from './app/router'

const { store, persistor } = createAppStore()
// Enables RTK Query's `refetchOnFocus` / `refetchOnReconnect`.
setupListeners(store.dispatch)
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={<LoadingScreen />}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'font-heading!',
              success: 'bg-[#22a745]! text-white! border-[#22a745]!',
              description: 'text-inherit!',
            },
          }}
        />
      </PersistGate>
    </Provider>
  )
}
