import { useState, useEffect } from 'react'
import { Wine } from '@/types/wine'
import { Tenant } from '@/types/tenant'

interface UseWinesReturn {
  wines: Wine[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export const useWines = (tenantName: string | undefined): UseWinesReturn => {
  const [wines, setWines] = useState<Wine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWines = async () => {
    if (!tenantName) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/tenantByName/${tenantName}`)
      if (!res.ok) throw new Error('Failed to fetch wines')

      const data: Tenant = await res.json()
      const tenant = data
      const wines = tenant.wineEntries || []
      console.log('tenant', tenant)
      setWines(wines)
    } catch (err) {
      setError('Wines could not be loaded. Try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWines()
  }, [tenantName])

  return {
    wines,
    isLoading,
    error,
    refetch: fetchWines,
  }
}
