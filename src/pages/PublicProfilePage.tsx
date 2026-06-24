import { ArrowLeft } from 'lucide-react'
import { usePublicProfile } from '../profile/usePublicProfile'
import './PublicProfilePage.css'

interface PublicProfilePageProps {
  userId: string
  onBack: () => void
}

export function PublicProfilePage({ userId, onBack }: PublicProfilePageProps) {
  const { profile, loading, error } = usePublicProfile(userId)

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
        </div>
      )}
    </div>
  )
}
