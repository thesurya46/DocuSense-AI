import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

interface ProfileProps {
  user: User
  onSignOut: () => void
}

function Avatar({ url, initials, size = 80 }: { url?: string; initials: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--color-cyan)44', background: 'var(--color-cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {url ? (
        <img src={url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: size * 0.36, fontWeight: 700, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', userSelect: 'none' }}>{initials}</span>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 6, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled }: { value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ width: '100%', background: disabled ? 'var(--color-surface-2)' : 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: 7, padding: '9px 12px', color: disabled ? 'var(--color-text-3)' : 'var(--color-text)', fontSize: 13.5, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s', cursor: disabled ? 'not-allowed' : 'text' }}
      onFocus={(e) => { if (!disabled) e.currentTarget.style.borderColor = 'var(--color-cyan)66' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-strong)' }}
    />
  )
}

export default function Profile({ user, onSignOut }: ProfileProps) {
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = (displayName || user.email || '?').slice(0, 2).toUpperCase()
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Load profile from user_metadata on mount
  useEffect(() => {
    const meta = user.user_metadata ?? {}
    setDisplayName(meta.display_name ?? meta.full_name ?? '')
    setBio(meta.bio ?? '')
    setAvatarUrl(meta.avatar_url ?? undefined)
  }, [user])

  const resizeToDataUrl = (file: File, maxPx = 256): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = url
    })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB', 'error'); return }

    setUploading(true)
    try {
      const dataUrl = await resizeToDataUrl(file, 256)
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: dataUrl } })
      if (error) throw error
      setAvatarUrl(dataUrl)
      toast('Profile picture updated', 'success')
    } catch (err: unknown) {
      toast(`Upload failed: ${(err as Error).message}`, 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim(), bio: bio.trim() },
      })
      if (error) throw error
      setSavedOk(true)
      toast('Profile saved', 'success')
      setTimeout(() => setSavedOk(false), 2500)
    } catch (err: unknown) {
      toast(`Save failed: ${(err as Error).message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPwd.trim()) { toast('Enter a new password', 'error'); return }
    if (newPwd !== confirmPwd) { toast('Passwords do not match', 'error'); return }
    if (newPwd.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    setChangingPwd(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      setNewPwd('')
      setConfirmPwd('')
      toast('Password updated', 'success')
    } catch (err: unknown) {
      toast(`Failed: ${(err as Error).message}`, 'error')
    } finally {
      setChangingPwd(false)
    }
  }

  return (
    <div className="page-shell animate-fade-in" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Header card */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '28px 28px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar url={avatarUrl} initials={initials} size={80} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--color-bg)', background: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            {uploading
              ? <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #070809', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
              : <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v7M2 6l3.5 3.5L9 6" stroke="#070809" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            }
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em', marginBottom: 3 }}>
            {displayName || user.email?.split('@')[0] || 'User'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 8 }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 5, padding: '3px 8px' }}>
              Joined {joinedDate}
            </span>
            <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', background: 'var(--color-cyan-dim)', border: '1px solid var(--color-cyan)33', borderRadius: 5, padding: '3px 8px' }}>
              {user.app_metadata?.provider ?? 'email'}
            </span>
          </div>
        </div>

        <button onClick={onSignOut}
          style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-3)', fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-danger-dim)'; e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.borderColor = 'var(--color-danger)44' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-3)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}>
          Sign out
        </button>
      </div>

      {/* Edit profile */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5a1.414 1.414 0 012 2L4 11H2v-2L9.5 1.5z" stroke="var(--color-cyan)" strokeWidth="1.3" strokeLinejoin="round" /></svg>
          Edit profile
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <Field label="Display name">
            <Input value={displayName} onChange={setDisplayName} placeholder="Your name" />
          </Field>
          <Field label="Email address">
            <Input value={user.email ?? ''} disabled />
          </Field>
        </div>
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a little about yourself…"
            rows={3}
            style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: 7, padding: '9px 12px', color: 'var(--color-text)', fontSize: 13.5, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.15s' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-cyan)66')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
          />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSaveProfile} disabled={saving}
            style={{ padding: '9px 22px', borderRadius: 7, border: 'none', background: savedOk ? 'var(--color-success)' : 'var(--color-cyan)', color: '#070809', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7 }}>
            {saving && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #070809', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />}
            {savedOk ? '✓ Saved' : saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="7" rx="1" stroke="var(--color-cyan)" strokeWidth="1.3" /><path d="M5 6V4a2 2 0 014 0v2" stroke="var(--color-cyan)" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Change password
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <Field label="New password">
            <Input type="password" value={newPwd} onChange={setNewPwd} placeholder="Min. 6 characters" />
          </Field>
          <Field label="Confirm password">
            <Input type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Repeat new password" />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleChangePassword} disabled={changingPwd}
            style={{ padding: '9px 22px', borderRadius: 7, border: 'none', background: 'var(--color-surface-2)', border2: '1px solid var(--color-border)', color: 'var(--color-text-2)', fontSize: 13.5, fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: changingPwd ? 'not-allowed' : 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)' } as React.CSSProperties}
            onMouseEnter={(e) => { if (!changingPwd) { e.currentTarget.style.borderColor = 'var(--color-cyan)66'; e.currentTarget.style.color = 'var(--color-cyan)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)' }}>
            {changingPwd && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />}
            {changingPwd ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </div>

      {/* Account info */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '20px 28px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="var(--color-cyan)" strokeWidth="1.3" /><path d="M7 6v4M7 4.5v.5" stroke="var(--color-cyan)" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Account details
        </div>
        {[
          { label: 'User ID', value: user.id },
          { label: 'Email confirmed', value: user.email_confirmed_at ? new Date(user.email_confirmed_at).toLocaleString() : 'Not confirmed' },
          { label: 'Last sign-in', value: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—' },
          { label: 'Auth provider', value: user.app_metadata?.provider ?? 'email' },
        ].map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', minWidth: 140, paddingTop: 1 }}>{row.label}</span>
            <span style={{ fontSize: 12.5, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
