import { useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { usePublicProfile } from '../profile/usePublicProfile'
import { usePublicListings } from '../listings/usePublicListings'
import { getListingImageUrl } from '../listings/useListings'
import type { ListingSelection } from '../listings/types'
import './PublicProfilePage.css'

interface PublicProfilePageProps {
  userId: string
  onBack: () => void
  onSelectListing: (selection: ListingSelection) => void
}

export function PublicProfilePage({ userId, onBack, onSelectListing }: PublicProfilePageProps) {
  const { profile, loading, error } = usePublicProfile(userId)
  const [showListings, setShowListings] = useState(false)

  return (
    <div className="public-profile-page">
      <button className="listing-detail-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      {loading && <p className="home-status">Loading profile…</p>}
      {error && <p className="home-status home-error">Couldn't load profile: {error}</p>}

      {profile && (
        <div className="public-profile-card">
          <div className="public-profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} />
            ) : (
              <span>{profile.display_name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h1>{profile.display_name}</h1>
          {profile.location_label && <p className="public-profile-location">📍 {profile.location_label}</p>}
          {profile.introduction && <p className="public-profile-introduction">{profile.introduction}</p>}

          <button type="button" className="btn-primary public-profile-view-listings" onClick={() => setShowListings(true)}>
            View listings
          </button>
        </div>
      )}

      {showListings && (
        <SellerListingsModal
          userId={userId}
          displayName={profile?.display_name ?? 'Seller'}
          onClose={() => setShowListings(false)}
          onSelectListing={onSelectListing}
        />
      )}
    </div>
  )
}

function SellerListingsModal({
  userId,
  displayName,
  onClose,
  onSelectListing,
}: {
  userId: string
  displayName: string
  onClose: () => void
  onSelectListing: (selection: ListingSelection) => void
}) {
  const { listings, loading, error } = usePublicListings(userId)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h1>{displayName}'s listings</h1>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {loading && <p className="home-status">Loading listings…</p>}
        {error && <p className="home-status home-error">Couldn't load listings: {error}</p>}

        {!loading && !error && listings.length === 0 && <p className="home-status">No active listings.</p>}

        {!loading && !error && listings.length > 0 && (
          <ul className="seller-listing-list">
            {listings.map((listing) => {
              const imageUrl = getListingImageUrl(listing)
              return (
                <li
                  key={listing.id}
                  className="seller-listing-row"
                  onClick={() => {
                    onSelectListing({ kind: 'real', id: listing.id })
                    onClose()
                  }}
                >
                  <div className="seller-listing-thumb">
                    {imageUrl ? <img src={imageUrl} alt={listing.title} /> : <div className="seller-listing-thumb-placeholder" />}
                  </div>
                  <div className="seller-listing-info">
                    <span className="seller-listing-title">{listing.title}</span>
                    {listing.location_label && <span className="seller-listing-location">📍 {listing.location_label}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
