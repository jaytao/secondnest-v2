import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export async function markConversationRead(conversationId: string) {
  await supabase.rpc('mark_conversation_read', { conversation_id: conversationId })
}

export function useMessages(conversationId: string) {
  const { session } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setMessages(data as Message[])
        setLoading(false)
        if (!error) markConversationRead(conversationId)
      })

    return () => {
      cancelled = true
    }
  }, [conversationId])

  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const message = payload.new as Message
          setMessages((current) => [...current, message])
          if (message.sender_id !== session.user.id) markConversationRead(conversationId)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, session])

  async function sendMessage(body: string) {
    if (!session) return { error: 'Not signed in' }
    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: session.user.id, body })
    return { error: error?.message ?? null }
  }

  return { messages, loading, error, sendMessage }
}
