import { ArrowLeft } from 'lucide-react'
import './LegalPage.css'

interface AboutPageProps {
  onBack: () => void
}

export function AboutPage({ onBack }: AboutPageProps) {
  return (
    <div className="legal-page">
      <button className="listing-detail-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1>About secondnest</h1>

      <p>
        Babies outgrow things fast. Cribs, clothes, bouncers, maternity wear — most of it is barely
        used before it's ready for its next family. secondnest exists to make that handoff easy:
        a local, free, peer-to-peer marketplace where parents can give away what they no longer
        need instead of letting it sit in a closet or a landfill.
      </p>

      <h2>What you can do here</h2>
      <ul>
        <li>List baby and maternity items you're ready to pass along</li>
        <li>Search and filter listings near you by item type, age range, and condition</li>
        <li>Message other parents directly to arrange a pickup, without sharing personal contact info</li>
      </ul>

      <h2>Why it's free</h2>
      <p>
        secondnest is a giveaway marketplace, not a resale platform. Items here are passed
        along for free, person to person — the goal is to keep useful things in circulation within
        your own community rather than treat them as disposable.
      </p>

      <h2>A quick safety note</h2>
      <p>
        Since exchanges happen directly between users, use the same judgment you would with any
        in-person meetup: meet in a public place when you can, and trust your instincts. See our
        Terms of Service (linked below) for more on how the platform works.
      </p>
    </div>
  )
}
