import { useEffect, useState } from 'react'
import { TermsPage } from '../pages/TermsPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import { getInitialDeepLink, setDeepLinkParam } from '../lib/deepLink'
import './Footer.css'

type LegalPage = 'terms' | 'privacy' | null

function readInitialLegalPage(): LegalPage {
  const link = getInitialDeepLink()
  if (link?.key === 'legal' && (link.value === 'terms' || link.value === 'privacy')) return link.value
  return null
}

function readLegalPageFromUrl(): LegalPage {
  const value = new URLSearchParams(window.location.search).get('legal')
  return value === 'terms' || value === 'privacy' ? value : null
}

export function Footer() {
  const [legalPage, setLegalPage] = useState<LegalPage>(readInitialLegalPage)

  useEffect(() => {
    function handlePopState() {
      setLegalPage(readLegalPageFromUrl())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function openLegalPage(page: LegalPage) {
    setLegalPage(page)
    setDeepLinkParam(page ? 'legal' : null, page ?? undefined)
  }

  return (
    <>
      <footer className="app-footer">
        <button type="button" onClick={() => openLegalPage('terms')}>
          Terms of Service
        </button>
        <span>·</span>
        <button type="button" onClick={() => openLegalPage('privacy')}>
          Privacy Policy
        </button>
      </footer>

      {legalPage && (
        <div className="legal-overlay">
          {legalPage === 'terms' ? (
            <TermsPage onBack={() => openLegalPage(null)} />
          ) : (
            <PrivacyPage onBack={() => openLegalPage(null)} />
          )}
        </div>
      )}
    </>
  )
}
