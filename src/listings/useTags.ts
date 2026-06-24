import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Tag {
  id: string
  category: 'item_type' | 'age_range' | 'condition'
  value: string
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tags')
      .select('id, category, value')
      .then(({ data, error }) => {
        if (!error && data) setTags(data as Tag[])
        setLoading(false)
      })
  }, [])

  return { tags, loading }
}
