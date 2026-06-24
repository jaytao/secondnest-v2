import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export interface ConversationSummary {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  listings: { title: string } | null
  buyer: { display_name: string; avatar_url: string | null } | null
  seller: { display_name: string; avatar_url: string | null } | null
  unread_count: number
}

async function fetchUnreadCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc('unread_message_counts')
  const map = new Map<string, number>()
  if (!error && data) {
    for (const row of data as { conversation_id: string; unread_count: number }[]) {
      map.set(row.conversation_id, row.unread_count)
    }
  }
  return map
}

export function useConversations() {
  const { session } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)

    const [{ data, error }, unreadCounts] = await Promise.all([
      supabase
        .from('conversations')
        .select(
          'id, listing_id, buyer_id, seller_id, created_at, listings(title), buyer:profiles!conversations_buyer_id_fkey(display_name, avatar_url), seller:profiles!conversations_seller_id_fkey(display_name, avatar_url)',
        )
        .order('created_at', { ascending: false }),
      fetchUnreadCounts(),
    ])

    if (error) {
      setError(error.message)
    } else {
      const rows = data as unknown as Omit<ConversationSummary, 'unread_count'>[]
      setConversations(rows.map((row) => ({ ...row, unread_count: unreadCounts.get(row.id) ?? 0 })))
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, () => refetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => refetch())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, refetch])

  return { conversations, loading, error, refetch }
}

export async function startConversation(listingId: string, sellerId: string, buyerId: string) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .maybeSingle()

  if (existing) return { id: existing.id as string, error: null }

  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select('id')
    .single()

  if (error) return { id: null, error: error.message }
  return { id: data.id as string, error: null }
}
