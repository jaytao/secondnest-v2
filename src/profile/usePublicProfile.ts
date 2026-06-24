import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface PublicProfile {
  id: string
  display_name: string
  avatar_url: string | null
  location_label: string | null
}

export function usePublicProfile(userId: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, location_label')
      .eq('id', userId)
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
  }, [userId])

  return { profile, loading, error }
}
