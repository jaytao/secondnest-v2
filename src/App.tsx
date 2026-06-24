import { useState } from 'react'
import { CirclePlus, LogOut, MessageCircle, User } from 'lucide-react'
import { AuthPage } from './auth/AuthPage'
import { useAuth } from './auth/AuthContext'
import { supabase } from './lib/supabase'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { MyListingsPage } from './pages/MyListingsPage'
import { MessagesPage } from './pages/MessagesPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { PublicProfilePage } from './pages/PublicProfilePage'
import { CreateListingModal } from './listings/CreateListingModal'
import { useUnreadCount } from './messaging/useUnreadCount'
import { Footer } from './components/Footer'
import type { ListingSelection } from './listings/types'
import './App.css'

type Page = 'home' | 'profile' | 'my-listings' | 'messages'

function App() {
  const { session, loading } = useAuth()
  const { count: unreadCount } = useUnreadCount()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState<Page>('home')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [listingsVersion, setListingsVersion] = useState(0)
  const [selectedListing, setSelectedListing] = useState<ListingSelection | null>(null)
  const [openConversationId, setOpenConversationId] = useState<string | null>(null)
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(null)

  if (loading) return null

  if (!session) return <AuthPage />

  function goTo(nextPage: Page) {
    setPage(nextPage)
    setSelectedListing(null)
    setViewedProfileId(null)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="app-name" onClick={() => goTo('home')}>
          🐣 secondnest
        </button>
        <input
          type="search"
          className="app-search"
          placeholder="Search for baby & maternity items…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <div className="app-header-icons">
          <button
            className="app-icon-button"
            title="New listing"
            aria-label="New listing"
            onClick={() => setIsCreateOpen(true)}
          >
            <CirclePlus size={20} />
          </button>
          <button
            className="app-icon-button"
            title="Messages"
            aria-label="Messages"
            onClick={() => {
              setOpenConversationId(null)
              goTo('messages')
            }}
          >
            <MessageCircle size={20} />
            {unreadCount > 0 && <span className="app-icon-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          <button className="app-icon-button" title="Profile" aria-label="Profile" onClick={() => goTo('profile')}>
            <User size={20} />
          </button>
          <button
            className="app-icon-button"
            title="Log out"
            aria-label="Log out"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>
      <main>
        {viewedProfileId ? (
          <PublicProfilePage userId={viewedProfileId} onBack={() => setViewedProfileId(null)} />
        ) : selectedListing ? (
          <ListingDetailPage
            selection={selectedListing}
            onBack={() => setSelectedListing(null)}
            onOpenConversation={(conversationId) => {
              setOpenConversationId(conversationId)
              setSelectedListing(null)
              setPage('messages')
            }}
          />
        ) : page === 'home' ? (
          <HomePage key={listingsVersion} searchQuery={searchQuery} onSelectListing={setSelectedListing} />
        ) : page === 'profile' ? (
          <ProfilePage onManageListings={() => goTo('my-listings')} />
        ) : page === 'messages' ? (
          <MessagesPage initialConversationId={openConversationId} onViewProfile={setViewedProfileId} />
        ) : (
          <MyListingsPage />
        )}
      </main>
      <Footer />
      {isCreateOpen && (
        <CreateListingModal
          onClose={() => setIsCreateOpen(false)}
          onSaved={() => {
            setIsCreateOpen(false)
            goTo('home')
            setListingsVersion((version) => version + 1)
          }}
        />
      )}
    </div>
  )
}

export default App
