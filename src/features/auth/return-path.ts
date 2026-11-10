import type { Location } from 'react-router-dom'

/** Where to go once signed in, carried through the verification step. */
export function returnPath(location: Location) {
  return (location.state as { from?: Location } | null)?.from?.pathname ?? '/'
}
