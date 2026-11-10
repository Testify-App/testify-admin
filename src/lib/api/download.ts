import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/store'
import { API_BASE_URL } from './base-api'

/** Downloads a file from an authenticated endpoint (e.g. a CSV export) and saves it. */
export function useDownload() {
  const token = useAppSelector((state) => state.auth.session?.token)
  return useCallback(
    async (path: string, params: Record<string, string | undefined>, filename: string) => {
      const query = new URLSearchParams(
        Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]),
      )
      const response = await fetch(`${API_BASE_URL}${path}${query.size ? `?${query}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        toast.error('The export could not be created. Please try again.')
        return false
      }
      const url = URL.createObjectURL(await response.blob())
      Object.assign(document.createElement('a'), { href: url, download: filename }).click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return true
    },
    [token],
  )
}
