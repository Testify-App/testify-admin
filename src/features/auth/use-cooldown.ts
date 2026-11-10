import { useEffect, useState } from 'react'

/** Seconds left before a code can be resent; `restart()` starts a new countdown. */
export function useCooldown(seconds = 60) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) return
    const timer = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])
  return { left, restart: () => setLeft(seconds) }
}
