import { ArrowLeft } from 'lucide-react'
import './LegalPage.css'

interface PrivacyPageProps {
  onBack: () => void
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <div className="legal-page">
      <button className="listing-detail-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: [date]</p>

      <p className="legal-disclaimer">
        This is a template provided for general informational purposes and has not been reviewed by a lawyer. It is
        not legal advice. Replace the bracketed placeholders and have qualified legal counsel review this document
        before relying on it, especially if you collect data from users in jurisdictions with specific privacy laws
        (e.g. GDPR, CCPA).
      </p>

      <p>
        This Privacy Policy describes how secondnest ("we," "us," or "our") collects, uses, and shares information
        when you use our platform.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account information:</strong> email address, display name, and profile photo.</li>
        <li>
          <strong>Location information:</strong> a general location (e.g. city/neighborhood and approximate
          coordinates) that you choose to provide, used to show nearby listings.
        </li>
        <li><strong>Listing content:</strong> titles, descriptions, photos, and tags you submit.</li>
        <li><strong>Messages:</strong> content of messages you send to other users through the Platform.</li>
        <li>
          <strong>Usage information:</strong> basic technical data such as browser type, device information, and how
          you interact with the Platform.
        </li>
      </ul>

      <h2>2. How We Use Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>operate, maintain, and improve the Platform;</li>
        <li>display your listings and profile to other users;</li>
        <li>show you listings near a location you specify;</li>
        <li>enable messaging between users;</li>
        <li>maintain the security and integrity of the Platform.</li>
      </ul>

      <h2>3. How We Share Information</h2>
      <p>
        Your display name, profile photo, listings, and general location are visible to other users by design — this
        is a public marketplace. We do not sell your personal information. We share information with the following
        categories of service providers solely to operate the Platform:
      </p>
      <ul>
        <li>our database, authentication, and file storage provider (Supabase);</li>
        <li>a third-party geocoding service used to convert a typed location into map coordinates (OpenStreetMap Nominatim);</li>
        <li>if you sign in with Google, Google's OAuth service, per Google's own privacy policy.</li>
      </ul>

      <h2>4. Other Users</h2>
      <p>
        Messaging and listings are designed to limit the exposure of your direct contact information. However, we
        cannot control what other users do with information you choose to share with them directly (for example,
        during an in-person meetup). Exercise discretion in what you share.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain your account information and content for as long as your account is active. You may delete your
        listings at any time, and may request deletion of your account by contacting us at [contact email].
      </p>

      <h2>6. Your Choices</h2>
      <p>
        You can update or remove your profile and location information at any time from your profile page. You can
        delete individual listings from "Your listings."
      </p>

      <h2>7. Security</h2>
      <p>
        We use reasonable administrative and technical safeguards to protect your information, but no system is
        completely secure, and we cannot guarantee absolute security.
      </p>

      <h2>8. Children's Privacy</h2>
      <p>
        The Platform is not directed to children, and we do not knowingly collect personal information from anyone
        under 18.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Continued use of the Platform constitutes acceptance of the revised policy.</p>

      <h2>10. Contact</h2>
      <p>Questions about this Privacy Policy can be sent to [contact email].</p>
    </div>
  )
}
