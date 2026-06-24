import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export function useUnreadCount() {
  const { session } = useAuth()
  const [count, setCount] = useState(0)

  const refetch = useCallback(async () => {
    if (!session) return
    const { data, error } = await supabase.rpc('unread_message_counts')
    if (!error && data) {
      const total = (data as { unread_count: number }[]).reduce((sum, row) => sum + row.unread_count, 0)
      setCount(total)
    }
  }, [session])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refetch())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => refetch())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, refetch])

  return { count, refetch }
}
