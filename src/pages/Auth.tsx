import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex' }}>

      {/* Left panel — branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 56px', background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', minWidth: 0 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--color-cyan-glow)' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2z" fill="#070809" fillRule="evenodd" />
              <circle cx="10" cy="10" r="2" fill="#070809" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>RAG Intel</span>
        </div>

        {/* Center copy */}
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Document Intelligence</div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 18px', maxWidth: 360 }}>
            Ask anything.<br />Get cited answers.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.7, margin: 0, maxWidth: 340 }}>
            Upload your documents, and chat with them using AI — every answer grounded in your own content with transparent citations.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
            {['pgvector search', 'GPT-4o answers', 'Citation-grounded', 'Private & secure'].map((f) => (
              <span key={f} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--color-border-strong)', color: 'var(--color-text-3)', background: 'var(--color-surface-2)' }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>
          Your data is private. Documents and conversations are tied to your account only.
        </p>
      </div>

      {/* Right panel — form */}
      <div style={{ width: 460, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.025em', margin: '0 0 6px' }}>
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-3)', margin: 0 }}>
              {mode === 'signin' ? "Sign in to your workspace" : 'Get started for free'}
            </p>
          </div>

          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid var(--color-border)' }}>
            {(['signin', 'signup'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{ flex: 1, padding: '10px 0', border: 'none', borderBottom: `2px solid ${mode === m ? 'var(--color-cyan)' : 'transparent'}`, background: 'transparent', color: mode === m ? 'var(--color-text)' : 'var(--color-text-3)', fontSize: 14, fontWeight: mode === m ? 600 : 400, fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1 }}>
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, color: 'var(--color-text-2)', display: 'block', marginBottom: 7, fontWeight: 500 }}>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com"
                style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: 8, padding: '11px 14px', color: 'var(--color-text)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-cyan)88')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12.5, color: 'var(--color-text-2)', display: 'block', marginBottom: 7, fontWeight: 500 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: 8, padding: '11px 44px 11px 14px', color: 'var(--color-text)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-cyan)88')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 5, background: 'transparent', color: 'var(--color-text-3)', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-3)')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {showPassword ? <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></> : <><path d="M3 3l18 18" /><path d="M10.6 6.1A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.4 17.4 0 0 1-3.2 3.8M6.2 6.3C3.5 8.1 2 12 2 12s3.5 6 10 6a10.8 10.8 0 0 0 3.5-.6" /></>}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--color-danger-dim)', border: '1px solid var(--color-danger)44', borderRadius: 8, fontSize: 13, color: 'var(--color-danger)', lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>{error}
              </div>
            )}

            {success && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--color-success-dim)', border: '1px solid var(--color-success)44', borderRadius: 8, fontSize: 13, color: 'var(--color-success)', lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>✓</span>{success}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: loading ? 'var(--color-surface-3)' : 'var(--color-cyan)', color: loading ? 'var(--color-text-3)' : '#070809', fontSize: 14.5, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 0 20px var(--color-cyan-glow)' }}>
              {loading && <span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />}
              {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in →' : 'Create account →')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12.5, color: 'var(--color-text-3)', lineHeight: 1.6 }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', fontSize: 12.5, fontFamily: 'var(--font-sans)', padding: 0, fontWeight: 500 }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
