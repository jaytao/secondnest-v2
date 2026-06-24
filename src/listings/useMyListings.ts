import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export interface MyListing {
  id: string
  title: string
  description: string | null
  location_label: string | null
  status: 'active' | 'pending' | 'given_away' | 'removed'
  created_at: string
  listing_images: { id: string; storage_path: string; position: number }[]
  listing_tags: { tag_id: string }[]
}

export function useMyListings() {
  const { session } = useAuth()
  const [listings, setListings] = useState<MyListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('listings')
      .select(
        'id, title, description, location_label, status, created_at, listing_images(id, storage_path, position), listing_tags(tag_id)',
      )
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setListings(data as unknown as MyListing[])
    setLoading(false)
  }, [session])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function deleteListing(listing: MyListing) {
    if (listing.listing_images.length > 0) {
      await supabase.storage.from('listing-images').remove(listing.listing_images.map((image) => image.storage_path))
    }
    const { error } = await supabase.from('listings').delete().eq('id', listing.id)
    if (!error) setListings((current) => current.filter((item) => item.id !== listing.id))
    return { error: error?.message ?? null }
  }

  async function setStatus(listing: MyListing, status: MyListing['status']) {
    const { error } = await supabase.from('listings').update({ status }).eq('id', listing.id)
    if (!error) {
      setListings((current) => current.map((item) => (item.id === listing.id ? { ...item, status } : item)))
    }
    return { error: error?.message ?? null }
  }

  return { listings, loading, error, refetch, deleteListing, setStatus }
}

export function getMyListingImageUrl(listing: MyListing): string | null {
  const [first] = [...listing.listing_images].sort((a, b) => a.position - b.position)
  if (!first) return null
  return supabase.storage.from('listing-images').getPublicUrl(first.storage_path).data.publicUrl
}
