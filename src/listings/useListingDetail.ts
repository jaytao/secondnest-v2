import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Tag } from './useTags'
import type { DisplayTag } from './TagChips'
import type { MyListing } from './useMyListings'

export interface ListingDetail {
  id: string
  owner_id: string
  title: string
  description: string | null
  location_label: string | null
  status: 'active' | 'pending' | 'given_away' | 'removed'
  created_at: string
  listing_images: { id: string; storage_path: string; position: number }[]
  listing_tags: { tag_id: string; tags: { category: Tag['category']; value: string } }[]
  profiles: { display_name: string; avatar_url: string | null } | null
}

export function useListingDetail(id: string) {
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('listings')
      .select(
        'id, owner_id, title, description, location_label, status, created_at, listing_images(id, storage_path, position), listing_tags(tag_id, tags(category, value)), profiles(display_name, avatar_url)',
      )
      .eq('id', id)
      .single()

    if (error) setError(error.message)
    else setListing(data as unknown as ListingDetail)
    setLoading(false)
  }, [id])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { listing, loading, error, refetch }
}

export function getListingImageUrls(listing: ListingDetail): string[] {
  return [...listing.listing_images]
    .sort((a, b) => a.position - b.position)
    .map((image) => supabase.storage.from('listing-images').getPublicUrl(image.storage_path).data.publicUrl)
}

export function getListingDetailTags(listing: ListingDetail): DisplayTag[] {
  return listing.listing_tags.map((entry) => entry.tags)
}

export function toEditableListing(listing: ListingDetail): MyListing {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    location_label: listing.location_label,
    status: listing.status,
    created_at: listing.created_at,
    listing_images: listing.listing_images,
    listing_tags: listing.listing_tags.map((entry) => ({ tag_id: entry.tag_id })),
  }
}
