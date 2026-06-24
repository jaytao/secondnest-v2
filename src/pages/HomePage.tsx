import { useEffect, useMemo, useRef, useState } from 'react'
import { useListings, useHasAnyListings, getListingImageUrl, getListingTags } from '../listings/useListings'
import { useTags, type Tag } from '../listings/useTags'
import { useNearbyListings } from '../listings/useNearbyListings'
import { CATEGORY_LABELS } from '../listings/tagCategories'
import { DUMMY_LISTINGS } from '../listings/dummyListings'
import { ListingCard } from '../listings/ListingCard'
import { LocationAutocomplete, type LocationSuggestion } from '../profile/LocationAutocomplete'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useMediaQuery } from '../lib/useMediaQuery'
import type { Listing, ListingSelection } from '../listings/types'
import './HomePage.css'

const RADIUS_OPTIONS_MILES = [1, 5, 10, 25, 50]
const PAGE_SIZE = 20

interface HomePageProps {
  searchQuery: string
  onSelectListing: (selection: ListingSelection) => void
}

export function HomePage({ searchQuery, onSelectListing }: HomePageProps) {
  const hasAnyListings = useHasAnyListings()
  const { tags } = useTags()
  const [locationFilter, setLocationFilter] = useState('')
  const [nearbyLocation, setNearbyLocation] = useState<LocationSuggestion | null>(null)
  const [radiusMiles, setRadiusMiles] = useState(10)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const isMobile = useMediaQuery('(max-width: 640px)')

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const debouncedLocationFilter = useDebouncedValue(locationFilter, 300)

  const { distancesById, loading: nearbyLoading, error: nearbyError } = useNearbyListings(
    nearbyLocation,
    radiusMiles,
  )

  const nearbyIdsOrdered = useMemo(() => {
    if (!nearbyLocation || !distancesById) return null
    return Array.from(distancesById.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id)
  }, [nearbyLocation, distancesById])

  const tagValues = useMemo(() => Array.from(selectedTags), [selectedTags])

  const filters = useMemo(
    () => ({
      search: debouncedSearchQuery.trim(),
      locationText: nearbyLocation ? '' : debouncedLocationFilter.trim(),
      tagValues,
      nearbyIdsOrdered,
    }),
    [debouncedSearchQuery, debouncedLocationFilter, nearbyLocation, tagValues, nearbyIdsOrdered],
  )

  const { listings, totalCount, loading, error } = useListings(filters, page, PAGE_SIZE)

  const [accumulated, setAccumulated] = useState<Listing[]>([])
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Any filter change should restart pagination from page 1.
  useEffect(() => {
    setPage(1)
  }, [filters.search, filters.locationText, filters.tagValues.join(','), filters.nearbyIdsOrdered?.join(',')])

  // On mobile, append each loaded page to a running list instead of replacing it.
  useEffect(() => {
    if (!isMobile) return
    setAccumulated((current) => (page === 1 ? listings : [...current, ...listings]))
  }, [isMobile, page, listings])

  useEffect(() => {
    if (!isMobile) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && accumulated.length < totalCount) {
          setPage((current) => current + 1)
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isMobile, loading, accumulated.length, totalCount])

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

  if (hasAnyListings === null) return <p className="home-status">Loading listings…</p>

  function resultsText(count: number) {
    const parts = []
    if (nearbyLocation) parts.push(`within ${radiusMiles} mi of "${locationFilter}"`)
    else if (filters.locationText) parts.push(`near "${locationFilter}"`)
    if (filters.search) parts.push(`matching "${searchQuery}"`)
    if (selectedTags.size > 0) parts.push(`tagged ${Array.from(selectedTags).join(', ')}`)
    const suffix = parts.length > 0 ? ` ${parts.join(' ')}` : ' for you'
    if (count === 0) return `No items found${suffix}.`
    return `We found ${count} item${count === 1 ? '' : 's'}${suffix}.`
  }

  if (hasAnyListings === false) {
    const query = filters.search.toLowerCase()
    const location = filters.locationText.toLowerCase()
    const filtered = DUMMY_LISTINGS.filter((listing) => {
      const titleMatch = listing.title.toLowerCase().includes(query)
      const locationMatch = !location || listing.location_label.toLowerCase().includes(location)
      const listingTagValues = listing.tags.map((tag) => tag.value)
      const tagMatch = tagValues.every((tag) => listingTagValues.includes(tag))
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

  if (error) {
    return (
      <>
        {filterBar}
        <p className="home-status home-error">Couldn't load listings: {error}</p>
      </>
    )
  }

  const displayedListings = isMobile ? accumulated : listings
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <>
      {filterBar}
      <p className="home-results-text">{resultsText(totalCount)}</p>

      {loading && displayedListings.length === 0 ? (
        <p className="home-status">Loading listings…</p>
      ) : (
        <div className="listing-grid">
          {displayedListings.map((listing) => (
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
      )}

      {isMobile ? (
        <div ref={sentinelRef} className="home-infinite-scroll-sentinel">
          {loading && displayedListings.length > 0 && <p className="home-status">Loading more…</p>}
        </div>
      ) : (
        totalPages > 1 && (
          <div className="home-pagination">
            <button disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                className={pageNumber === page ? 'active' : ''}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>
              Next
            </button>
          </div>
        )
      )}
    </>
  )
}
