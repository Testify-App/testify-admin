import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist'
import { useDispatch, useSelector } from 'react-redux'
import { baseApi } from '@/lib/api/base-api'
import { sessionReducer } from './session-slice'

// Add feature reducers here as modules are created.
const rootReducer = combineReducers({
  auth: sessionReducer,
  [baseApi.reducerPath]: baseApi.reducer,
})
// Explicit async storage avoids CommonJS default-export interop in modern bundlers.
const storage = {
  getItem: async (key: string) => sessionStorage.getItem(key),
  setItem: async (key: string, value: string) => {
    sessionStorage.setItem(key, value)
  },
  removeItem: async (key: string) => {
    sessionStorage.removeItem(key)
  },
}
export function createAppStore() {
  const store = configureStore({
    reducer: persistReducer<ReturnType<typeof rootReducer>>(
      { key: 'testify', version: 1, storage, whitelist: ['auth'] },
      rootReducer,
    ),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE] },
      }).concat(baseApi.middleware),
  })
  return { store, persistor: persistStore(store) }
}
export type AppStore = ReturnType<typeof createAppStore>['store']
export type RootState = ReturnType<AppStore['getState']>
export const useAppDispatch = useDispatch.withTypes<AppStore['dispatch']>()
export const useAppSelector = useSelector.withTypes<RootState>()
