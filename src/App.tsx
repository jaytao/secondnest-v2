import { useEffect, useState } from 'react'
import { CirclePlus, LogIn, LogOut, MessageCircle, User } from 'lucide-react'
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
import { getInitialDeepLink, setDeepLinkParam } from './lib/deepLink'
import type { ListingSelection } from './listings/types'
import './App.css'

type Page = 'home' | 'profile' | 'my-listings' | 'messages'

const initialDeepLink = getInitialDeepLink()

function App() {
  const { session, loading } = useAuth()
  const { count: unreadCount } = useUnreadCount()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState<Page>('home')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [listingsVersion, setListingsVersion] = useState(0)
  const [selectedListing, setSelectedListing] = useState<ListingSelection | null>(
    initialDeepLink?.key === 'listing' ? { kind: 'real', id: initialDeepLink.value } : null,
  )
  const [openConversationId, setOpenConversationId] = useState<string | null>(null)
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(
    initialDeepLink?.key === 'profile' ? initialDeepLink.value : null,
  )

  // Keep the URL's deep-link param in sync with whichever of these is actually
  // showing, mirroring the render priority below (profile beats listing).
  useEffect(() => {
    if (viewedProfileId) setDeepLinkParam('profile', viewedProfileId)
    else if (selectedListing?.kind === 'real') setDeepLinkParam('listing', selectedListing.id)
    else setDeepLinkParam(null)
  }, [viewedProfileId, selectedListing])

  if (loading) return null

  function goTo(nextPage: Page) {
    setPage(nextPage)
    setSelectedListing(null)
    setViewedProfileId(null)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="app-name"
          onClick={() => {
            goTo('home')
            setShowAuth(false)
          }}
        >
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
          {session ? (
            <>
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
              <button
                className="app-icon-button"
                title="Profile"
                aria-label="Profile"
                onClick={() => goTo('profile')}
              >
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
            </>
          ) : (
            <button className="app-login-button" onClick={() => setShowAuth(true)}>
              <LogIn size={16} /> Log in
            </button>
          )}
        </div>
      </header>
      <main>
        {showAuth && !session ? (
          <AuthPage />
        ) : viewedProfileId ? (
          <PublicProfilePage
            userId={viewedProfileId}
            onBack={() => setViewedProfileId(null)}
            onSelectListing={(selection) => {
              setSelectedListing(selection)
              setViewedProfileId(null)
            }}
          />
        ) : selectedListing ? (
          <ListingDetailPage
            selection={selectedListing}
            onBack={() => setSelectedListing(null)}
            onRequireAuth={() => setShowAuth(true)}
            onViewProfile={setViewedProfileId}
            onOpenConversation={(conversationId) => {
              setOpenConversationId(conversationId)
              setSelectedListing(null)
              setPage('messages')
            }}
          />
        ) : page === 'home' || !session ? (
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
      {isCreateOpen && session && (
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
