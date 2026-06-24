import { useState } from 'react'
import { CirclePlus, LogOut, MessageCircle, User } from 'lucide-react'
import { AuthPage } from './auth/AuthPage'
import { useAuth } from './auth/AuthContext'
import { supabase } from './lib/supabase'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { MyListingsPage } from './pages/MyListingsPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { CreateListingModal } from './listings/CreateListingModal'
import type { ListingSelection } from './listings/types'
import './App.css'

type Page = 'home' | 'profile' | 'my-listings'

function App() {
  const { session, loading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState<Page>('home')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [listingsVersion, setListingsVersion] = useState(0)
  const [selectedListing, setSelectedListing] = useState<ListingSelection | null>(null)

  if (loading) return null

  if (!session) return <AuthPage />

  function goTo(nextPage: Page) {
    setPage(nextPage)
    setSelectedListing(null)
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
          <button className="app-icon-button" title="Messages" aria-label="Messages">
            <MessageCircle size={20} />
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
        {selectedListing ? (
          <ListingDetailPage selection={selectedListing} onBack={() => setSelectedListing(null)} />
        ) : page === 'home' ? (
          <HomePage key={listingsVersion} searchQuery={searchQuery} onSelectListing={setSelectedListing} />
        ) : page === 'profile' ? (
          <ProfilePage onManageListings={() => goTo('my-listings')} />
        ) : (
          <MyListingsPage />
        )}
      </main>
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
