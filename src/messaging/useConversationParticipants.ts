import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Participant {
  id: string
  display_name: string
  avatar_url: string | null
}

export function useConversationParticipants(conversationId: string) {
  const [buyer, setBuyer] = useState<Participant | null>(null)
  const [seller, setSeller] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    supabase
      .from('conversations')
      .select(
        'buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url), seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url)',
      )
      .eq('id', conversationId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          const row = data as unknown as { buyer: Participant; seller: Participant }
          setBuyer(row.buyer)
          setSeller(row.seller)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [conversationId])

  return { buyer, seller, loading }
}
