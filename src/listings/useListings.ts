import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Listing } from './types'
import type { DisplayTag } from './TagChips'

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('listings')
        .select(
          'id, title, description, location_label, status, created_at, listing_images(storage_path, position), listing_tags(tags(category, value))',
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (error) {
        setError(error.message)
      } else {
        setListings(data as unknown as Listing[])
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { listings, loading, error }
}

export function getListingImageUrl(listing: Listing): string | null {
  const [first] = [...listing.listing_images].sort((a, b) => a.position - b.position)
  if (!first) return null
  return supabase.storage.from('listing-images').getPublicUrl(first.storage_path).data.publicUrl
}

export function getListingTags(listing: Listing): DisplayTag[] {
  return listing.listing_tags.map((entry) => entry.tags)
}
