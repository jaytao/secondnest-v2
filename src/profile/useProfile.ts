import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

const PROFILE_COLUMNS = 'id, display_name, avatar_url, location_label, latitude, longitude, introduction'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  location_label: string | null
  latitude: number | null
  longitude: number | null
  introduction: string | null
}

interface ProfileUpdates {
  display_name?: string
  avatar_url?: string
  location_label?: string
  introduction?: string | null
  lat?: number
  lon?: number
}

export function useProfile() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setLoading(true)

    supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setProfile(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  async function updateProfile(updates: ProfileUpdates) {
    if (!session) return { error: 'Not signed in' }

    const { lat, lon, ...rest } = updates
    const payload: Record<string, unknown> = { ...rest }
    if (lat !== undefined && lon !== undefined) {
      payload.location = `POINT(${lon} ${lat})`
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', session.user.id)
      .select(PROFILE_COLUMNS)
      .single()

    if (!error) setProfile(data)
    return { error: error?.message ?? null }
  }

  async function uploadAvatar(file: File) {
    if (!session) return { error: 'Not signed in' }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${session.user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) return { error: uploadError.message }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return updateProfile({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
  }

  return { profile, loading, error, updateProfile, uploadAvatar }
}
