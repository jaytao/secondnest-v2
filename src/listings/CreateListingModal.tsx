import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { X } from 'lucide-react'
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
  const [existingImages] = useState<ExistingImage[]>(listing?.listing_images ?? [])
  const [removedImageIds, setRemovedImageIds] = useState<Set<string>>(new Set())
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (locationTouched || !profile?.location_label) return
    setLocationLabel(profile.location_label)
    if (profile.latitude !== null && profile.longitude !== null) {
      setPendingLocation({ label: profile.location_label, lat: profile.latitude, lon: profile.longitude })
    }
  }, [profile, locationTouched])

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [files])

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
    setFiles((current) => [...current, ...selected])
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index))
  }

  function removeExistingImage(imageId: string) {
    setRemovedImageIds((current) => new Set(current).add(imageId))
  }

  function getImageUrl(path: string) {
    return supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl
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

    const keptExisting = existingImages.filter((image) => !removedImageIds.has(image.id))
    if (removedImageIds.size > 0) {
      const toRemove = existingImages.filter((image) => removedImageIds.has(image.id))
      await supabase.storage.from('listing-images').remove(toRemove.map((image) => image.storage_path))
      await supabase
        .from('listing_images')
        .delete()
        .in('id', toRemove.map((image) => image.id))
    }

    if (files.length > 0) {
      const startPosition = keptExisting.length > 0 ? Math.max(...keptExisting.map((image) => image.position)) + 1 : 0
      const uploads = await Promise.all(
        files.map(async (file, index) => {
          const position = startPosition + index
          const path = `${session.user.id}/${savedListing.id}/${position}-${file.name}`
          const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, file)
          return { path, position, uploadError }
        }),
      )

      const failed = uploads.find((upload) => upload.uploadError)
      if (failed?.uploadError) {
        setError(`Listing saved, but an image failed to upload: ${failed.uploadError.message}`)
      }

      const succeeded = uploads.filter((upload) => !upload.uploadError)
      if (succeeded.length > 0) {
        await supabase.from('listing_images').insert(
          succeeded.map((upload) => ({
            listing_id: savedListing.id,
            storage_path: upload.path,
            position: upload.position,
          })),
        )
      }
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

          {(existingImages.length > 0 || files.length > 0) && (
            <ul className="file-preview-grid">
              {existingImages
                .filter((image) => !removedImageIds.has(image.id))
                .map((image) => (
                  <li key={image.id} className="file-preview-item">
                    <img src={getImageUrl(image.storage_path)} alt="" />
                    <button type="button" onClick={() => removeExistingImage(image.id)} aria-label="Remove photo">
                      <X size={14} />
                    </button>
                  </li>
                ))}
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="file-preview-item">
                  <img src={previewUrls[index]} alt={file.name} />
                  <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
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
