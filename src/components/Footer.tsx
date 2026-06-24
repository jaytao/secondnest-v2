import { useState } from 'react'
import { TermsPage } from '../pages/TermsPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import './Footer.css'

type LegalPage = 'terms' | 'privacy' | null

export function Footer() {
  const [legalPage, setLegalPage] = useState<LegalPage>(null)

  return (
    <>
      <footer className="app-footer">
        <button type="button" onClick={() => setLegalPage('terms')}>
          Terms of Service
        </button>
        <span>·</span>
        <button type="button" onClick={() => setLegalPage('privacy')}>
          Privacy Policy
        </button>
      </footer>

      {legalPage && (
        <div className="legal-overlay">
          {legalPage === 'terms' ? (
            <TermsPage onBack={() => setLegalPage(null)} />
          ) : (
            <PrivacyPage onBack={() => setLegalPage(null)} />
          )}
        </div>
      )}
    </>
  )
}
