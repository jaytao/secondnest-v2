import { useState, type FormEvent } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useConversations, type ConversationSummary } from '../messaging/useConversations'
import { useMessages } from '../messaging/useMessages'
import { useConversationParticipants, type Participant } from '../messaging/useConversationParticipants'
import './MessagesPage.css'

interface MessagesPageProps {
  initialConversationId?: string | null
  onViewProfile: (userId: string) => void
}

export function MessagesPage({ initialConversationId, onViewProfile }: MessagesPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null)
  const { conversations, loading, error, refetch } = useConversations()

  if (selectedId) {
    return (
      <ConversationThread
        conversationId={selectedId}
        onBack={() => {
          setSelectedId(null)
          refetch()
        }}
        onViewProfile={onViewProfile}
      />
    )
  }

  if (loading) return <p className="home-status">Loading conversations…</p>
  if (error) return <p className="home-status home-error">Couldn't load conversations: {error}</p>

  return (
    <div className="messages-page">
      <h1>Messages</h1>
      {conversations.length === 0 ? (
        <p className="home-status">No conversations yet. Message a seller from a listing to start one.</p>
      ) : (
        <ul className="conversation-list">
          {conversations.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} onSelect={() => setSelectedId(conversation.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ConversationRow({ conversation, onSelect }: { conversation: ConversationSummary; onSelect: () => void }) {
  const { session } = useAuth()
  const isBuyer = session?.user.id === conversation.buyer_id
  const otherParty = isBuyer ? conversation.seller : conversation.buyer
  const hasUnread = conversation.unread_count > 0

  return (
    <li className={`conversation-row ${hasUnread ? 'unread' : ''}`} onClick={onSelect}>
      <div className="conversation-avatar">
        {otherParty?.avatar_url ? (
          <img src={otherParty.avatar_url} alt="" />
        ) : (
          <span>{otherParty?.display_name.charAt(0).toUpperCase() ?? '?'}</span>
        )}
      </div>
      <div className="conversation-info">
        <span className="conversation-listing-title">{conversation.listings?.title ?? 'Listing'}</span>
        <span className="conversation-other-party">with {otherParty?.display_name ?? 'Unknown'}</span>
      </div>
      {hasUnread && <span className="conversation-unread-count">{conversation.unread_count}</span>}
    </li>
  )
}

function MessageAvatar({ participant, onViewProfile }: { participant: Participant | null; onViewProfile: (userId: string) => void }) {
  if (!participant) return <div className="message-avatar" />
  return (
    <button
      className="message-avatar"
      onClick={() => onViewProfile(participant.id)}
      aria-label={`View ${participant.display_name}'s profile`}
      title={participant.display_name}
    >
      {participant.avatar_url ? (
        <img src={participant.avatar_url} alt="" />
      ) : (
        <span>{participant.display_name.charAt(0).toUpperCase()}</span>
      )}
    </button>
  )
}

function ConversationThread({
  conversationId,
  onBack,
  onViewProfile,
}: {
  conversationId: string
  onBack: () => void
  onViewProfile: (userId: string) => void
}) {
  const { session } = useAuth()
  const { messages, loading, error, sendMessage } = useMessages(conversationId)
  const { buyer, seller } = useConversationParticipants(conversationId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  function participantFor(senderId: string) {
    if (buyer?.id === senderId) return buyer
    if (seller?.id === senderId) return seller
    return null
  }

  const otherParticipant = session?.user.id === buyer?.id ? seller : buyer

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    setSending(true)
    await sendMessage(draft.trim())
    setSending(false)
    setDraft('')
  }

  return (
    <div className="conversation-thread">
      <button className="listing-detail-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back to messages
      </button>

      {otherParticipant && (
        <button className="conversation-thread-header" onClick={() => onViewProfile(otherParticipant.id)}>
          {otherParticipant.avatar_url ? (
            <img src={otherParticipant.avatar_url} alt="" />
          ) : (
            <span className="conversation-thread-header-initial">{otherParticipant.display_name.charAt(0).toUpperCase()}</span>
          )}
          <span>{otherParticipant.display_name}</span>
        </button>
      )}

      {loading && <p className="home-status">Loading messages…</p>}
      {error && <p className="home-status home-error">Couldn't load messages: {error}</p>}

      {!loading && !error && (
        <div className="message-list">
          {messages.length === 0 && <p className="home-status">Say hello!</p>}
          {messages.map((message) => {
            const isOwn = message.sender_id === session?.user.id
            return (
              <div key={message.id} className={`message-row ${isOwn ? 'own' : ''}`}>
                {!isOwn && <MessageAvatar participant={participantFor(message.sender_id)} onViewProfile={onViewProfile} />}
                <div className="message-bubble">{message.body}</div>
              </div>
            )
          })}
        </div>
      )}

      <form className="message-composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message…"
        />
        <button type="submit" disabled={sending || !draft.trim()} aria-label="Send" title="Send">
          <Send size={32} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}
