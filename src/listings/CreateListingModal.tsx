import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Star, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useTags, type Tag } from './useTags'
import { CATEGORY_LABELS } from './tagCategories'
import { LocationAutocomplete, type LocationSuggestion } from '../profile/LocationAutocomplete'
import { useProfile } from '../profile/useProfile'
import type { MyListing } from './useMyListings'
import './CreateListingModal.css'

interface ExistingImage {
  id: string
  storage_path: string
  position: number
}

interface ImageSlot {
  key: string
  kind: 'existing' | 'new'
  existingImage?: ExistingImage
  file?: File
  previewUrl: string
}

function getPublicImageUrl(path: string) {
  return supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl
}

interface CreateListingModalProps {
  listing?: MyListing
  onClose: () => void
  onSaved: () => void
}

export function CreateListingModal({ listing, onClose, onSaved }: CreateListingModalProps) {
  const isEditing = Boolean(listing)
  const { session } = useAuth()
  const { tags } = useTags()
  const { profile } = useProfile()

  const [title, setTitle] = useState(listing?.title ?? '')
  const [description, setDescription] = useState(listing?.description ?? '')
  const [locationLabel, setLocationLabel] = useState(listing?.location_label ?? '')
  const [pendingLocation, setPendingLocation] = useState<LocationSuggestion | null>(null)
  const [locationTouched, setLocationTouched] = useState(isEditing)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(listing?.listing_tags.map((entry) => entry.tag_id) ?? []),
  )
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() =>
    [...(listing?.listing_images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({
        key: image.id,
        kind: 'existing' as const,
        existingImage: image,
        previewUrl: getPublicImageUrl(image.storage_path),
      })),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imageSlotsRef = useRef(imageSlots)
  imageSlotsRef.current = imageSlots

  useEffect(() => {
    return () => {
      for (const slot of imageSlotsRef.current) {
        if (slot.kind === 'new') URL.revokeObjectURL(slot.previewUrl)
      }
    }
  }, [])

  useEffect(() => {
    if (locationTouched || !profile?.location_label) return
    setLocationLabel(profile.location_label)
    if (profile.latitude !== null && profile.longitude !== null) {
      setPendingLocation({ label: profile.location_label, lat: profile.latitude, lon: profile.longitude })
    }
  }, [profile, locationTouched])

  function toggleTag(tag: Tag) {
    setSelectedTagIds((current) => {
      const next = new Set(current)
      if (tag.category === 'condition') {
        for (const other of tags) {
          if (other.category === 'condition' && other.id !== tag.id) next.delete(other.id)
        }
      }
      if (next.has(tag.id)) next.delete(tag.id)
      else next.add(tag.id)
      return next
    })
  }

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    const newSlots: ImageSlot[] = selected.map((file) => ({
      key: `new-${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      kind: 'new',
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setImageSlots((current) => [...current, ...newSlots])
    event.target.value = ''
  }

  function removeSlot(key: string) {
    setImageSlots((current) => {
      const slot = current.find((s) => s.key === key)
      if (slot?.kind === 'new') URL.revokeObjectURL(slot.previewUrl)
      return current.filter((s) => s.key !== key)
    })
  }

  function moveSlot(index: number, direction: -1 | 1) {
    setImageSlots((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function makeCover(index: number) {
    setImageSlots((current) => {
      if (index === 0) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      return next
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session) return

    setSubmitting(true)
    setError(null)

    const listingPayload = {
      title,
      description: description || null,
      location_label: locationLabel || null,
      ...(pendingLocation ? { location: `POINT(${pendingLocation.lon} ${pendingLocation.lat})` } : {}),
    }

    const { data: savedListing, error: listingError } = isEditing
      ? await supabase.from('listings').update(listingPayload).eq('id', listing!.id).select('id').single()
      : await supabase
          .from('listings')
          .insert({ owner_id: session.user.id, ...listingPayload })
          .select('id')
          .single()

    if (listingError || !savedListing) {
      setError(listingError?.message ?? 'Failed to save listing')
      setSubmitting(false)
      return
    }

    const keptExistingIds = new Set(
      imageSlots.filter((slot) => slot.kind === 'existing').map((slot) => slot.existingImage!.id),
    )
    const removedExisting = (listing?.listing_images ?? []).filter((image) => !keptExistingIds.has(image.id))
    if (removedExisting.length > 0) {
      await supabase.storage.from('listing-images').remove(removedExisting.map((image) => image.storage_path))
      await supabase
        .from('listing_images')
        .delete()
        .in('id', removedExisting.map((image) => image.id))
    }

    const uploadResults = await Promise.all(
      imageSlots.map(async (slot, index) => {
        if (slot.kind !== 'new') return null
        const path = `${session.user.id}/${savedListing.id}/${index}-${slot.file!.name}`
        const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, slot.file!)
        return { index, path, uploadError }
      }),
    )

    const failedUpload = uploadResults.find((result) => result?.uploadError)
    if (failedUpload?.uploadError) {
      setError(`Listing saved, but an image failed to upload: ${failedUpload.uploadError.message}`)
    }

    const newImageInserts = uploadResults
      .filter((result) => result && !result.uploadError)
      .map((result) => ({ listing_id: savedListing.id, storage_path: result!.path, position: result!.index }))

    if (newImageInserts.length > 0) {
      await supabase.from('listing_images').insert(newImageInserts)
    }

    const positionUpdates = imageSlots
      .map((slot, index) =>
        slot.kind === 'existing' && slot.existingImage!.position !== index
          ? { id: slot.existingImage!.id, position: index }
          : null,
      )
      .filter((update): update is { id: string; position: number } => update !== null)

    if (positionUpdates.length > 0) {
      await Promise.all(
        positionUpdates.map((update) =>
          supabase.from('listing_images').update({ position: update.position }).eq('id', update.id),
        ),
      )
    }

    if (isEditing) {
      const previousTagIds = new Set(listing!.listing_tags.map((entry) => entry.tag_id))
      const toAdd = Array.from(selectedTagIds).filter((id) => !previousTagIds.has(id))
      const toRemove = Array.from(previousTagIds).filter((id) => !selectedTagIds.has(id))

      if (toRemove.length > 0) {
        await supabase.from('listing_tags').delete().eq('listing_id', savedListing.id).in('tag_id', toRemove)
      }
      if (toAdd.length > 0) {
        await supabase
          .from('listing_tags')
          .insert(toAdd.map((tagId) => ({ listing_id: savedListing.id, tag_id: tagId })))
      }
    } else if (selectedTagIds.size > 0) {
      await supabase
        .from('listing_tags')
        .insert(Array.from(selectedTagIds).map((tagId) => ({ listing_id: savedListing.id, tag_id: tagId })))
    }

    setSubmitting(false)
    onSaved()
  }

  const tagsByCategory = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    acc[tag.category] = acc[tag.category] ?? []
    acc[tag.category].push(tag)
    return acc
  }, {})

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h1>{isEditing ? 'Edit listing' : 'New listing'}</h1>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form className="create-listing-form" onSubmit={handleSubmit}>
          <label className="modal-field">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>

          <label className="modal-field">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </label>

          <label className="modal-field">
            Location
            <LocationAutocomplete
              value={locationLabel}
              onChange={(value) => {
                setLocationTouched(true)
                setLocationLabel(value)
                setPendingLocation(null)
              }}
              onSelect={(suggestion) => {
                setLocationTouched(true)
                setLocationLabel(suggestion.label)
                setPendingLocation(suggestion)
              }}
            />
          </label>

          <div className="modal-field">
            Tags
            {(Object.keys(CATEGORY_LABELS) as Tag['category'][]).map((category) => (
              <div key={category} className="tag-category">
                <span className="tag-category-label">{CATEGORY_LABELS[category]}</span>
                <div className="tag-chip-row">
                  {(tagsByCategory[category] ?? []).map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`tag-chip-toggle ${selectedTagIds.has(tag.id) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <label className="modal-field">
            Photos
            <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
          </label>

          {imageSlots.length > 0 && (
            <>
              <p className="file-preview-hint">The first photo is what shows up on the listing. Use the arrows to reorder, or the star to set a cover photo.</p>
              <ul className="file-preview-grid">
                {imageSlots.map((slot, index) => (
                  <li key={slot.key} className={`file-preview-item ${index === 0 ? 'is-cover' : ''}`}>
                    <img src={slot.previewUrl} alt="" />

                    {index === 0 ? (
                      <span className="file-preview-cover-badge">
                        <Star size={12} /> Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="file-preview-make-cover"
                        onClick={() => makeCover(index)}
                        aria-label="Set as cover photo"
                        title="Set as cover photo"
                      >
                        <Star size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="file-preview-remove"
                      onClick={() => removeSlot(slot.key)}
                      aria-label="Remove photo"
                    >
                      <X size={14} />
                    </button>

                    <div className="file-preview-move">
                      <button
                        type="button"
                        onClick={() => moveSlot(index, -1)}
                        disabled={index === 0}
                        aria-label="Move earlier"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlot(index, 1)}
                        disabled={index === imageSlots.length - 1}
                        aria-label="Move later"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Post listing'}
          </button>
        </form>
      </div>
    </div>
  )
}
