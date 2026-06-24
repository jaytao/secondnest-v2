import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Tag } from './useTags'
import type { DisplayTag } from './TagChips'

export interface ListingDetail {
  id: string
  owner_id: string
  title: string
  description: string | null
  location_label: string | null
  status: 'active' | 'pending' | 'given_away' | 'removed'
  created_at: string
  listing_images: { storage_path: string; position: number }[]
  listing_tags: { tags: { category: Tag['category']; value: string } }[]
  profiles: { display_name: string; avatar_url: string | null } | null
}

export function useListingDetail(id: string) {
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('listings')
      .select(
        'id, owner_id, title, description, location_label, status, created_at, listing_images(storage_path, position), listing_tags(tags(category, value)), profiles(display_name, avatar_url)',
      )
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setListing(data as unknown as ListingDetail)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return { listing, loading, error }
}

export function getListingImageUrls(listing: ListingDetail): string[] {
  return [...listing.listing_images]
    .sort((a, b) => a.position - b.position)
    .map((image) => supabase.storage.from('listing-images').getPublicUrl(image.storage_path).data.publicUrl)
}

export function getListingDetailTags(listing: ListingDetail): DisplayTag[] {
  return listing.listing_tags.map((entry) => entry.tags)
}
