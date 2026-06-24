import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useProfile } from '../profile/useProfile'
import { LocationAutocomplete, type LocationSuggestion } from '../profile/LocationAutocomplete'
import './ProfilePage.css'

interface ProfilePageProps {
  onManageListings: () => void
}

export function ProfilePage({ onManageListings }: ProfilePageProps) {
  const { profile, loading, error, updateProfile, uploadAvatar } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [pendingLocation, setPendingLocation] = useState<LocationSuggestion | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name)
      setLocationLabel(profile.location_label ?? '')
    }
  }, [profile])

  if (loading) return <p className="profile-status">Loading profile…</p>
  if (error) return <p className="profile-status profile-error">Couldn't load profile: {error}</p>
  if (!profile) return null

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaved(false)

    const { error } = await updateProfile({
      display_name: displayName,
      location_label: locationLabel,
      ...(pendingLocation ? { lat: pendingLocation.lat, lon: pendingLocation.lon } : {}),
    })

    setSaving(false)
    if (error) setSaveError(error)
    else setSaved(true)
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const { error } = await uploadAvatar(file)
    setAvatarUploading(false)
    if (error) setSaveError(error)
  }

  return (
    <form className="profile-page" onSubmit={handleSave}>
      <h1>Your profile</h1>

      <div className="profile-avatar-row">
        <div className="profile-avatar">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" />
          ) : (
            <span>{displayName.charAt(0).toUpperCase() || '?'}</span>
          )}
        </div>
        <label className="profile-avatar-upload">
          {avatarUploading ? 'Uploading…' : 'Change photo'}
          <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
        </label>
      </div>

      <label className="profile-field">
        Display name
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
      </label>

      <label className="profile-field">
        Location
        <LocationAutocomplete
          value={locationLabel}
          onChange={(value) => {
            setLocationLabel(value)
            setPendingLocation(null)
          }}
          onSelect={(suggestion) => {
            setLocationLabel(suggestion.label)
            setPendingLocation(suggestion)
          }}
        />
      </label>

      {saveError && <p className="profile-error">{saveError}</p>}
      {saved && <p className="profile-success">Saved!</p>}

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>

      <button type="button" className="profile-manage-listings" onClick={onManageListings}>
        Manage your listings →
      </button>
    </form>
  )
}
