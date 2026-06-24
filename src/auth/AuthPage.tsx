import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Footer } from '../components/Footer'
import './AuthPage.css'

type Mode = 'sign-in' | 'sign-up'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'sign-up') {
      setMessage('Check your email to confirm your account.')
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    if (error) setError(error.message)
  }

  function switchMode() {
    setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'))
    setError(null)
    setMessage(null)
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="auth-brand-icon">🐣</span>
        <span className="auth-brand-name">secondnest</span>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{mode === 'sign-in' ? 'Log in' : 'Create an account'}</h1>

        <label className="auth-field">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="auth-field">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Log in' : 'Sign up'}
        </button>

        <div className="auth-divider">or</div>

        <button type="button" className="auth-google" onClick={handleGoogleSignIn}>
          Continue with Google
        </button>

        <button type="button" className="auth-switch" onClick={switchMode}>
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </form>

      <Footer />
    </div>
  )
}
