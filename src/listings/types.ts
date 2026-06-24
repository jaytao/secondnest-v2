import type { DummyListing } from './dummyListings'
import type { Tag } from './useTags'

export interface Listing {
  id: string
  title: string
  description: string | null
  location_label: string | null
  status: 'active' | 'pending' | 'given_away' | 'removed'
  created_at: string
  listing_images: { storage_path: string; position: number }[]
  listing_tags: { tags: { category: Tag['category']; value: string } }[]
}

export type ListingSelection = { kind: 'real'; id: string } | { kind: 'dummy'; listing: DummyListing }
