import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Listing } from './types'

export function usePublicListings(userId: string) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('listings')
      .select(
        'id, title, description, location_label, status, created_at, listing_images(storage_path, position), listing_tags(tags(category, value))',
      )
      .eq('owner_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setListings(data as unknown as Listing[])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { listings, loading, error }
}
