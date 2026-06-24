import { useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react'
import { useListingDetail, getListingImageUrls, getListingDetailTags, toEditableListing } from '../listings/useListingDetail'
import { TagChips } from '../listings/TagChips'
import { CreateListingModal } from '../listings/CreateListingModal'
import { useAuth } from '../auth/AuthContext'
import { startConversation } from '../messaging/useConversations'
import type { ListingSelection } from '../listings/types'
import './ListingDetailPage.css'

interface ListingDetailPageProps {
  selection: ListingSelection
  onBack: () => void
  onOpenConversation: (conversationId: string) => void
  onRequireAuth: () => void
  onViewProfile: (userId: string) => void
}

export function ListingDetailPage({
  selection,
  onBack,
  onOpenConversation,
  onRequireAuth,
  onViewProfile,
}: ListingDetailPageProps) {
  if (selection.kind === 'dummy') {
    return <DummyListingDetail listing={selection.listing} onBack={onBack} />
  }
  return (
    <RealListingDetail
      id={selection.id}
      onBack={onBack}
      onOpenConversation={onOpenConversation}
      onRequireAuth={onRequireAuth}
      onViewProfile={onViewProfile}
    />
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button className="listing-detail-back" onClick={onBack}>
      <ArrowLeft size={16} /> Back to listings
    </button>
  )
}

function ImageLightbox({
  urls,
  startIndex,
  onClose,
}: {
  urls: string[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <X size={32} />
      </button>

      {urls.length > 1 && (
        <button
          className="lightbox-nav lightbox-prev"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation()
            setIndex((current) => (current - 1 + urls.length) % urls.length)
          }}
        >
          <ChevronLeft size={36} />
        </button>
      )}

      <img src={urls[index]} alt="" className="lightbox-image" onClick={(event) => event.stopPropagation()} />

      {urls.length > 1 && (
        <button
          className="lightbox-nav lightbox-next"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation()
            setIndex((current) => (current + 1) % urls.length)
          }}
        >
          <ChevronRight size={36} />
        </button>
      )}
    </div>
  )
}

function RealListingDetail({
  id,
  onBack,
  onOpenConversation,
  onRequireAuth,
  onViewProfile,
}: {
  id: string
  onBack: () => void
  onOpenConversation: (conversationId: string) => void
  onRequireAuth: () => void
  onViewProfile: (userId: string) => void
}) {
  const { session } = useAuth()
  const { listing, loading, error, refetch } = useListingDetail(id)
  const [starting, setStarting] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (loading) return <p className="home-status">Loading listing…</p>
  if (error) return <p className="home-status home-error">Couldn't load listing: {error}</p>
  if (!listing) return null

  const imageUrls = getListingImageUrls(listing)
  const tags = getListingDetailTags(listing)
  const isOwnListing = session?.user.id === listing.owner_id

  async function handleMessageSeller() {
    if (!session) {
      onRequireAuth()
      return
    }
    setStarting(true)
    setMessageError(null)
    const { id: conversationId, error } = await startConversation(listing!.id, listing!.owner_id, session.user.id)
    setStarting(false)
    if (error || !conversationId) {
      setMessageError(error ?? 'Failed to start conversation')
      return
    }
    onOpenConversation(conversationId)
  }

  return (
    <div className="listing-detail">
      <div className="listing-detail-top">
        <BackButton onBack={onBack} />
        {isOwnListing && (
          <button className="listing-detail-edit" onClick={() => setIsEditing(true)}>
            <Pencil size={16} /> Edit
          </button>
        )}
      </div>

      <div className="listing-detail-gallery">
        {imageUrls.length > 0 ? (
          imageUrls.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={listing.title}
              onClick={() => setLightboxIndex(index)}
              className="listing-detail-gallery-photo"
            />
          ))
        ) : (
          <div className="listing-detail-gallery-placeholder" />
        )}
      </div>

      <h1>{listing.title}</h1>
      {listing.location_label && <p className="listing-detail-location">📍 {listing.location_label}</p>}

      <TagChips tags={tags} />

      {listing.description && <p className="listing-detail-description">{listing.description}</p>}

      {listing.profiles && (
        <button className="listing-detail-seller" onClick={() => onViewProfile(listing.owner_id)}>
          {listing.profiles.avatar_url ? (
            <img src={listing.profiles.avatar_url} alt={listing.profiles.display_name} />
          ) : (
            <span className="listing-detail-seller-initial">{listing.profiles.display_name.charAt(0).toUpperCase()}</span>
          )}
          <span>{listing.profiles.display_name}</span>
        </button>
      )}

      {messageError && <p className="modal-error">{messageError}</p>}

      {!isOwnListing && (
        <button className="listing-detail-message" onClick={handleMessageSeller} disabled={starting}>
          {starting ? 'Starting chat…' : session ? 'Message seller' : 'Log in to message seller'}
        </button>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox urls={imageUrls} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {isEditing && (
        <CreateListingModal
          listing={toEditableListing(listing)}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false)
            refetch()
          }}
        />
      )}
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
