import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useListingDetail, getListingImageUrls, getListingDetailTags } from '../listings/useListingDetail'
import { TagChips } from '../listings/TagChips'
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
  const { listing, loading, error } = useListingDetail(id)
  const [starting, setStarting] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)

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
