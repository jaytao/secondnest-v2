import { useState } from 'react'
import { useListings, getListingImageUrl, getListingTags } from '../listings/useListings'
import { useTags, type Tag } from '../listings/useTags'
import { useNearbyListings } from '../listings/useNearbyListings'
import { CATEGORY_LABELS } from '../listings/tagCategories'
import { DUMMY_LISTINGS } from '../listings/dummyListings'
import { ListingCard } from '../listings/ListingCard'
import { LocationAutocomplete, type LocationSuggestion } from '../profile/LocationAutocomplete'
import type { ListingSelection } from '../listings/types'
import './HomePage.css'

const RADIUS_OPTIONS_MILES = [1, 5, 10, 25, 50]

interface HomePageProps {
  searchQuery: string
  onSelectListing: (selection: ListingSelection) => void
}

export function HomePage({ searchQuery, onSelectListing }: HomePageProps) {
  const { listings, loading, error } = useListings()
  const { tags } = useTags()
  const [locationFilter, setLocationFilter] = useState('')
  const [nearbyLocation, setNearbyLocation] = useState<LocationSuggestion | null>(null)
  const [radiusMiles, setRadiusMiles] = useState(10)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  const { distancesById, loading: nearbyLoading, error: nearbyError } = useNearbyListings(
    nearbyLocation,
    radiusMiles,
  )

  const query = searchQuery.trim().toLowerCase()
  const location = locationFilter.trim().toLowerCase()

  function toggleTag(value: string) {
    setSelectedTags((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const tagsByCategory = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    acc[tag.category] = acc[tag.category] ?? []
    acc[tag.category].push(tag)
    return acc
  }, {})

  const filterBar = (
    <div className="home-filters">
      <div className="home-location-row">
        <LocationAutocomplete
          value={locationFilter}
          onChange={(value) => {
            setLocationFilter(value)
            setNearbyLocation(null)
          }}
          onSelect={(suggestion) => {
            setLocationFilter(suggestion.label)
            setNearbyLocation(suggestion)
          }}
        />
        {nearbyLocation && (
          <>
            <select
              className="home-radius-select"
              value={radiusMiles}
              onChange={(event) => setRadiusMiles(Number(event.target.value))}
            >
              {RADIUS_OPTIONS_MILES.map((miles) => (
                <option key={miles} value={miles}>
                  within {miles} mi
                </option>
              ))}
            </select>
            <button
              type="button"
              className="home-clear-location"
              onClick={() => {
                setLocationFilter('')
                setNearbyLocation(null)
              }}
            >
              Clear
            </button>
          </>
        )}
      </div>
      <div className="home-tag-filters">
        {(Object.keys(CATEGORY_LABELS) as Tag['category'][]).map((category) => (
          <div key={category} className="tag-category">
            <span className="tag-category-label">{CATEGORY_LABELS[category]}</span>
            <div className="tag-chip-row">
              {(tagsByCategory[category] ?? []).map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-chip-toggle ${selectedTags.has(tag.value) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) return <p className="home-status">Loading listings…</p>
  if (error) return <p className="home-status home-error">Couldn't load listings: {error}</p>

  const usingDummyData = listings.length === 0

  function resultsText(count: number) {
    const parts = []
    if (nearbyLocation) parts.push(`within ${radiusMiles} mi of "${locationFilter}"`)
    else if (location) parts.push(`near "${locationFilter}"`)
    if (query) parts.push(`matching "${searchQuery}"`)
    if (selectedTags.size > 0) parts.push(`tagged ${Array.from(selectedTags).join(', ')}`)
    const suffix = parts.length > 0 ? ` ${parts.join(' ')}` : ' for you'
    if (count === 0) return `No items found${suffix}.`
    return `We found ${count} item${count === 1 ? '' : 's'}${suffix}.`
  }

  if (usingDummyData) {
    const filtered = DUMMY_LISTINGS.filter((listing) => {
      const titleMatch = listing.title.toLowerCase().includes(query)
      const locationMatch = !location || listing.location_label.toLowerCase().includes(location)
      const listingTagValues = listing.tags.map((tag) => tag.value)
      const tagMatch = Array.from(selectedTags).every((tag) => listingTagValues.includes(tag))
      return titleMatch && locationMatch && tagMatch
    })

    return (
      <>
        <p className="home-status home-hint">No listings yet — showing example items so you can see how the marketplace will look.</p>
        {filterBar}
        <p className="home-results-text">{resultsText(filtered.length)}</p>
        <div className="listing-grid">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              title={listing.title}
              description={listing.description}
              locationLabel={listing.location_label}
              tags={listing.tags}
              emoji={listing.emoji}
              color={listing.color}
              onClick={() => onSelectListing({ kind: 'dummy', listing })}
            />
          ))}
        </div>
      </>
    )
  }

  if (nearbyError) {
    return (
      <>
        {filterBar}
        <p className="home-status home-error">Couldn't search by location: {nearbyError}</p>
      </>
    )
  }

  if (nearbyLocation && nearbyLoading) {
    return (
      <>
        {filterBar}
        <p className="home-status">Searching nearby…</p>
      </>
    )
  }

  const filtered = listings.filter((listing) => {
    const titleMatch = listing.title.toLowerCase().includes(query)
    const locationMatch = nearbyLocation
      ? (distancesById?.has(listing.id) ?? false)
      : !location || (listing.location_label ?? '').toLowerCase().includes(location)
    const listingTagValues = getListingTags(listing).map((tag) => tag.value)
    const tagMatch = Array.from(selectedTags).every((tag) => listingTagValues.includes(tag))
    return titleMatch && locationMatch && tagMatch
  })

  if (nearbyLocation && distancesById) {
    filtered.sort((a, b) => (distancesById.get(a.id) ?? Infinity) - (distancesById.get(b.id) ?? Infinity))
  }

  return (
    <>
      {filterBar}
      <p className="home-results-text">{resultsText(filtered.length)}</p>
      <div className="listing-grid">
        {filtered.map((listing) => (
          <ListingCard
            key={listing.id}
            title={listing.title}
            description={listing.description}
            locationLabel={listing.location_label}
            tags={getListingTags(listing)}
            imageUrl={getListingImageUrl(listing)}
            onClick={() => onSelectListing({ kind: 'real', id: listing.id })}
          />
        ))}
      </div>
    </>
  )
}
