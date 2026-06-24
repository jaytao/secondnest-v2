import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Listing } from './types'
import type { DisplayTag } from './TagChips'

const LISTING_COLUMNS =
  'id, title, description, location_label, status, created_at, listing_images(storage_path, position), listing_tags(tags(category, value))'

export interface ListingsFilters {
  search: string
  locationText: string
  tagValues: string[]
  // Ordered nearest-first by the nearby_listings RPC; null means "no radius restriction".
  nearbyIdsOrdered: string[] | null
}

// AND semantics: a listing must carry every selected tag value. PostgREST can't express
// "has all of these" as a single filter without a custom view/RPC, so this resolves each
// tag to its matching listing ids separately and intersects them client-side (cheap — only
// ids, never full rows).
async function getListingIdsMatchingTags(tagValues: string[]): Promise<Set<string>> {
  const { data: tagRows } = await supabase.from('tags').select('id, value').in('value', tagValues)
  const tagIdByValue = new Map((tagRows ?? []).map((row) => [row.value as string, row.id as string]))

  const idSets = await Promise.all(
    tagValues.map(async (value) => {
      const tagId = tagIdByValue.get(value)
      if (!tagId) return new Set<string>()
      const { data } = await supabase.from('listing_tags').select('listing_id').eq('tag_id', tagId)
      return new Set((data ?? []).map((row) => row.listing_id as string))
    }),
  )

  return idSets.reduce((acc, set) => new Set([...acc].filter((id) => set.has(id))))
}

async function getListingIdsMatchingTitle(search: string): Promise<Set<string>> {
  const { data } = await supabase.from('listings').select('id').eq('status', 'active').ilike('title', `%${search}%`)
  return new Set((data ?? []).map((row) => row.id as string))
}

export function useListings(filters: ListingsFilters, page: number, pageSize: number) {
  const [listings, setListings] = useState<Listing[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tagKey = filters.tagValues.join(',')
  const nearbyKey = filters.nearbyIdsOrdered?.join(',') ?? ''

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const tagIds = filters.tagValues.length > 0 ? await getListingIdsMatchingTags(filters.tagValues) : null
        if (cancelled) return

        if (filters.nearbyIdsOrdered) {
          let orderedIds = filters.nearbyIdsOrdered
          if (tagIds) orderedIds = orderedIds.filter((id) => tagIds.has(id))
          if (filters.search) {
            const titleIds = await getListingIdsMatchingTitle(filters.search)
            if (cancelled) return
            orderedIds = orderedIds.filter((id) => titleIds.has(id))
          }

          const pageIds = orderedIds.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
          if (pageIds.length === 0) {
            if (!cancelled) {
              setListings([])
              setTotalCount(orderedIds.length)
            }
          } else {
            const { data, error } = await supabase.from('listings').select(LISTING_COLUMNS).in('id', pageIds)
            if (error) throw error
            const byId = new Map((data as unknown as Listing[]).map((listing) => [listing.id, listing]))
            const ordered = pageIds.map((id) => byId.get(id)).filter((listing): listing is Listing => Boolean(listing))
            if (!cancelled) {
              setListings(ordered)
              setTotalCount(orderedIds.length)
            }
          }
        } else {
          let query = supabase.from('listings').select(LISTING_COLUMNS, { count: 'exact' }).eq('status', 'active')

          if (filters.search) query = query.ilike('title', `%${filters.search}%`)
          if (filters.locationText) query = query.ilike('location_label', `%${filters.locationText}%`)
          if (tagIds) query = query.in('id', Array.from(tagIds))

          const from = (page - 1) * pageSize
          const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1)

          if (error) throw error
          if (!cancelled) {
            setListings(data as unknown as Listing[])
            setTotalCount(count ?? 0)
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load listings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.locationText, tagKey, nearbyKey, page, pageSize])

  return { listings, totalCount, loading, error }
}

export function useHasAnyListings(): boolean | null {
  const [hasAny, setHasAny] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .then(({ count, error }) => {
        if (cancelled || error) return
        setHasAny((count ?? 0) > 0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return hasAny
}

export function getListingImageUrl(listing: Listing): string | null {
  const [first] = [...listing.listing_images].sort((a, b) => a.position - b.position)
  if (!first) return null
  return supabase.storage.from('listing-images').getPublicUrl(first.storage_path).data.publicUrl
}

export function getListingTags(listing: Listing): DisplayTag[] {
  return listing.listing_tags.map((entry) => entry.tags)
}
