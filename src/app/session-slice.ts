import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/** The signed-in admin. */
export interface SessionUser {
  id: string
  name: string
  email: string
  /** Role name, e.g. "Super Admin". */
  role?: string | null
  /** Permission keys such as `staff:update`. Unknown until `/auth/me` has loaded. */
  permissions?: string[]
}

export interface Session {
  token: string
  user: SessionUser
}

interface SessionState {
  session: Session | null
}

const initialState: SessionState = { session: null }

// Minimal session store so the API layer can attach the token and react to 401s.
const sessionSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn: (state, { payload }: PayloadAction<Session>) => {
      state.session = payload
    },
    /** Refreshes the signed-in admin from `/auth/me` (role and permission changes apply at once). */
    profileLoaded: (state, { payload }: PayloadAction<SessionUser>) => {
      if (state.session && state.session.user.id === payload.id) state.session.user = payload
    },
    signedOut: (state) => {
      state.session = null
    },
  },
})

export const { signedIn, profileLoaded, signedOut } = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
