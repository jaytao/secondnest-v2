import { useEffect, useState } from 'react'
import { TermsPage } from '../pages/TermsPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import './Footer.css'

type LegalPage = 'terms' | 'privacy' | null

function readLegalPageFromUrl(): LegalPage {
  const value = new URLSearchParams(window.location.search).get('legal')
  return value === 'terms' || value === 'privacy' ? value : null
}

function writeLegalPageToUrl(page: LegalPage) {
  const url = new URL(window.location.href)
  if (page) url.searchParams.set('legal', page)
  else url.searchParams.delete('legal')
  window.history.pushState(null, '', url)
}

export function Footer() {
  const [legalPage, setLegalPage] = useState<LegalPage>(readLegalPageFromUrl)

  useEffect(() => {
    function handlePopState() {
      setLegalPage(readLegalPageFromUrl())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function openLegalPage(page: LegalPage) {
    setLegalPage(page)
    writeLegalPageToUrl(page)
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
