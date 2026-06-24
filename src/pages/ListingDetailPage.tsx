import { ArrowLeft } from 'lucide-react'
import { useListingDetail, getListingImageUrls, getListingDetailTags } from '../listings/useListingDetail'
import { TagChips } from '../listings/TagChips'
import type { ListingSelection } from '../listings/types'
import './ListingDetailPage.css'

interface ListingDetailPageProps {
  selection: ListingSelection
  onBack: () => void
}

export function ListingDetailPage({ selection, onBack }: ListingDetailPageProps) {
  if (selection.kind === 'dummy') {
    return <DummyListingDetail listing={selection.listing} onBack={onBack} />
  }
  return <RealListingDetail id={selection.id} onBack={onBack} />
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button className="listing-detail-back" onClick={onBack}>
      <ArrowLeft size={16} /> Back to listings
    </button>
  )
}

function RealListingDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { listing, loading, error } = useListingDetail(id)

  if (loading) return <p className="home-status">Loading listing…</p>
  if (error) return <p className="home-status home-error">Couldn't load listing: {error}</p>
  if (!listing) return null

  const imageUrls = getListingImageUrls(listing)
  const tags = getListingDetailTags(listing)

  return (
    <div className="listing-detail">
      <BackButton onBack={onBack} />

      <div className="listing-detail-gallery">
        {imageUrls.length > 0 ? (
          imageUrls.map((url) => <img key={url} src={url} alt={listing.title} />)
        ) : (
          <div className="listing-detail-gallery-placeholder" />
        )}
      </div>

      <h1>{listing.title}</h1>
      {listing.location_label && <p className="listing-detail-location">📍 {listing.location_label}</p>}

      <TagChips tags={tags} />

      {listing.description && <p className="listing-detail-description">{listing.description}</p>}

      {listing.profiles && (
        <div className="listing-detail-seller">
          {listing.profiles.avatar_url ? (
            <img src={listing.profiles.avatar_url} alt={listing.profiles.display_name} />
          ) : (
            <span className="listing-detail-seller-initial">{listing.profiles.display_name.charAt(0).toUpperCase()}</span>
          )}
          <span>{listing.profiles.display_name}</span>
        </div>
      )}

      <button className="listing-detail-message" disabled title="Chat coming soon">
        Message seller
      </button>
    </div>
  )
}

function DummyListingDetail({
  listing,
  onBack,
}: {
  listing: import('../listings/dummyListings').DummyListing
  onBack: () => void
}) {
  return (
    <div className="listing-detail">
      <BackButton onBack={onBack} />

      <div className="listing-detail-gallery">
        <div className="listing-detail-gallery-placeholder" style={{ background: listing.color }}>
          <span className="listing-detail-gallery-emoji">{listing.emoji}</span>
        </div>
      </div>

      <h1>{listing.title}</h1>
      <p className="listing-detail-location">📍 {listing.location_label}</p>

      <TagChips tags={listing.tags} />

      <p className="listing-detail-description">{listing.description}</p>

      <p className="home-status home-hint">This is an example listing.</p>
    </div>
  )
}
