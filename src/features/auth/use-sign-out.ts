import { useCallback } from 'react'
import { useAppDispatch } from '@/app/store'
import { signedOut } from '@/app/session-slice'
import { baseApi } from '@/lib/api/base-api'
import { useSignOutMutation } from './auth-api'

/** Ends the server session (best effort) and clears local state. */
export function useSignOut() {
  const dispatch = useAppDispatch()
  const [signOut] = useSignOutMutation()
  return useCallback(async () => {
    try {
      await signOut().unwrap()
    } catch {
      // The session is cleared locally either way.
    }
    dispatch(signedOut())
    dispatch(baseApi.util.resetApiState())
  }, [dispatch, signOut])
}
