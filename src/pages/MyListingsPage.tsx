import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMyListings, getMyListingImageUrl, type MyListing } from '../listings/useMyListings'
import { CreateListingModal } from '../listings/CreateListingModal'
import './MyListingsPage.css'

const STATUS_OPTIONS: MyListing['status'][] = ['active', 'pending', 'given_away', 'removed']

type ModalState = 'create' | MyListing | null

export function MyListingsPage() {
  const { listings, loading, error, refetch, deleteListing, setStatus } = useMyListings()
  const [modalState, setModalState] = useState<ModalState>(null)

  async function handleDelete(listing: MyListing) {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return
    await deleteListing(listing)
  }

  if (loading) return <p className="home-status">Loading your listings…</p>
  if (error) return <p className="home-status home-error">Couldn't load your listings: {error}</p>

  return (
    <div className="my-listings-page">
      <div className="my-listings-header">
        <h1>Your listings</h1>
        <button className="my-listings-new" onClick={() => setModalState('create')}>
          <Plus size={16} /> New listing
        </button>
      </div>

      {listings.length === 0 ? (
        <p className="home-status">You haven't posted anything yet.</p>
      ) : (
        <ul className="my-listings-list">
          {listings.map((listing) => {
            const imageUrl = getMyListingImageUrl(listing)
            return (
              <li key={listing.id} className="my-listing-row">
                <div className="my-listing-thumb">
                  {imageUrl ? <img src={imageUrl} alt={listing.title} /> : <div className="my-listing-thumb-placeholder" />}
                </div>
                <div className="my-listing-info">
                  <span className="my-listing-title">{listing.title}</span>
                  {listing.location_label && <span className="my-listing-location">📍 {listing.location_label}</span>}
                </div>
                <select
                  className="my-listing-status"
                  value={listing.status}
                  onChange={(event) => setStatus(listing, event.target.value as MyListing['status'])}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <div className="my-listing-actions">
                  <button
                    className="app-icon-button"
                    title="Edit"
                    aria-label="Edit"
                    onClick={() => setModalState(listing)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="app-icon-button"
                    title="Delete"
                    aria-label="Delete"
                    onClick={() => handleDelete(listing)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {modalState && (
        <CreateListingModal
          listing={modalState === 'create' ? undefined : modalState}
          onClose={() => setModalState(null)}
          onSaved={() => {
            setModalState(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
