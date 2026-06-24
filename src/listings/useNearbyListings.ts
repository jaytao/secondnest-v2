import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface NearbyLocation {
  lat: number
  lon: number
}

const MILES_TO_METERS = 1609.34

export function useNearbyListings(location: NearbyLocation | null, radiusMiles: number) {
  const [distancesById, setDistancesById] = useState<Map<string, number> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!location) {
      setDistancesById(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .rpc('nearby_listings', {
        lat: location.lat,
        lon: location.lon,
        radius_meters: radiusMiles * MILES_TO_METERS,
      })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
          setDistancesById(null)
        } else {
          const map = new Map<string, number>()
          for (const row of data as { id: string; distance_meters: number }[]) {
            map.set(row.id, row.distance_meters / MILES_TO_METERS)
          }
          setDistancesById(map)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon, radiusMiles])

  return { distancesById, loading, error }
}
