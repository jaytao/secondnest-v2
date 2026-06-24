import { ArrowLeft } from 'lucide-react'
import './LegalPage.css'

interface TermsPageProps {
  onBack: () => void
}

export function TermsPage({ onBack }: TermsPageProps) {
  return (
    <div className="legal-page">
      <button className="listing-detail-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1>Terms of Service</h1>
      <p className="legal-updated">Last updated: [date]</p>

      <p className="legal-disclaimer">
        This is a template provided for general informational purposes and has not been reviewed by a lawyer. It is
        not legal advice. Replace the bracketed placeholders and have qualified legal counsel review this document
        before relying on it.
      </p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of secondnest (the "Platform," "we," "us," or
        "our"), a platform that allows users to list, discover, and arrange the giveaway of baby and maternity items
        with other users in their local area. By creating an account or using the Platform, you agree to these
        Terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account and use the Platform. By using the Platform, you
        represent that you meet this requirement and that all information you provide is accurate.
      </p>

      <h2>2. The Platform Is a Listing Service Only</h2>
      <p>
        Secondnest provides a venue for users to post listings and communicate with one another. We are not a party
        to any agreement between users, do not take possession of, inspect, store, or ship any item listed on the
        Platform, and do not facilitate payment between users. Any exchange of items is a private arrangement solely
        between the users involved.
      </p>

      <h2>3. Person-to-Person Interactions and Meetups</h2>
      <p>
        Use of the Platform requires direct interaction with other individuals, including arranging meetups to
        exchange items. You acknowledge and agree that:
      </p>
      <ul>
        <li>
          Secondnest does not verify the identity, background, age, or trustworthiness of any user, and does not
          conduct any background checks;
        </li>
        <li>
          Secondnest does not inspect, test, or verify the safety, condition, age-appropriateness, recall status, or
          compliance with any applicable safety standards of any item listed, including car seats, cribs, and other
          children's products;
        </li>
        <li>
          you are solely responsible for exercising caution and reasonable judgment when communicating with other
          users and when arranging, attending, or conducting any in-person meetup or exchange, including choosing
          safe public locations, bringing another person with you, and verifying the condition and safety of any item
          before accepting it;
        </li>
        <li>
          to the fullest extent permitted by law, Secondnest disclaims any and all responsibility or liability for
          any injury, death, property damage, loss, theft, dispute, or other harm arising out of or in any way
          related to your interactions, communications, meetups, or exchanges with other users, whether occurring on
          or off the Platform.
        </li>
      </ul>

      <h2>4. User Content and Listings</h2>
      <p>
        You are solely responsible for the accuracy of any listing, photo, description, or message you post. You
        represent that you lawfully own or have the right to give away any item you list, and that your listings do
        not violate any law or third-party right. We do not guarantee the accuracy, quality, safety, or legality of
        any listing and reserve the right to remove any content or account at our discretion.
      </p>

      <h2>5. Prohibited Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>list items that are unsafe, recalled, counterfeit, or illegal to give away in your jurisdiction;</li>
        <li>use the Platform for any commercial resale activity;</li>
        <li>harass, threaten, defraud, or impersonate another user;</li>
        <li>share another user's contact information or content without consent;</li>
        <li>attempt to circumvent, disable, or interfere with the Platform's security features.</li>
      </ul>

      <h2>6. Disclaimer of Warranties</h2>
      <p>
        THE PLATFORM AND ALL LISTINGS ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EITHER
        EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR
        NON-INFRINGEMENT. WE DO NOT WARRANT THAT ANY ITEM LISTED IS SAFE, ACCURATELY DESCRIBED, OR FIT FOR USE.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, SECONDNEST AND ITS OWNERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE
        FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, GOODWILL, OR
        PROFITS, OR FOR ANY INJURY, DEATH, OR PROPERTY DAMAGE, ARISING FROM OR RELATED TO YOUR USE OF THE PLATFORM OR
        ANY INTERACTION WITH ANOTHER USER, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL AGGREGATE
        LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE PLATFORM SHALL NOT EXCEED [USD $100].
      </p>

      <h2>8. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Secondnest and its owners, employees, and agents from any claim,
        damage, loss, or expense (including reasonable attorneys' fees) arising out of your use of the Platform, your
        listings, your interactions with other users, or your violation of these Terms.
      </p>

      <h2>9. Account Termination</h2>
      <p>
        We may suspend or terminate your account at any time, with or without notice, for conduct that we believe
        violates these Terms or is harmful to other users or the Platform.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Platform after a change constitutes
        acceptance of the revised Terms.
      </p>

      <h2>11. Governing Law</h2>
      <p>These Terms are governed by the laws of [your state/country], without regard to conflict-of-law principles.</p>

      <h2>12. Contact</h2>
      <p>Questions about these Terms can be sent to [contact email].</p>
    </div>
  )
}
