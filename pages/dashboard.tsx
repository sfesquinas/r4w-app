// pages/dashboard.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('Wisher.1')
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }

      setEmail(session.user.email ?? '')
      setUserId(session.user.id)

      // 1) Nombre del perfil (Wisher.X)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error cargando perfil', profileError)
      }

      let resolvedName = profile?.full_name ?? ''
      if (!resolvedName) {
        // si no hay nombre guardado, dejamos Wisher.1 por defecto
        resolvedName = 'Wisher.1'
      }
      setDisplayName(resolvedName)

      // 2) Avatar actual del usuario (join user_avatars -> avatars)
      const { data: ua, error: uaError } = await supabase
        .from('user_avatars')
        .select('avatars(image_url)')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (uaError) {
        console.error('Error cargando avatar del usuario', uaError)
      }

      // ua?.avatars?.image_url (sin tipos estrictos para evitar errores de build)
      const img = (ua as any)?.avatars?.image_url as string | undefined
      if (img) {
        setAvatarUrl(img)
      }
    })()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1>Panel</h1>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 24 }}>
        {/* Avatar grande */}
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 24,
            background: '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {avatarUrl ? (
            // imagen real del avatar
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            // placeholder si no hay avatar
            <span style={{ fontSize: 64, color: '#aaa' }}>A2</span>
          )}
        </div>

        <div>
          {/* Nombre visible */}
          <h2 style={{ margin: 0 }}>{displayName}</h2>
          <p style={{ margin: '4px 0 0' }}>{email}</p>
          {userId && (
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
              ID: {userId}
            </p>
          )}
        </div>
      </div>

      <nav style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link href="/answer">Responder pregunta</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/avatars">Cambiar avatar</Link>
      </nav>

      <button
        onClick={signOut}
        style={{
          marginTop: 32,
          padding: '10px 16px',
          borderRadius: 10,
          border: '1px solid #333',
          background: '#f5f5f5'
        }}
      >
        Cerrar sesión
      </button>
    </main>
  )
}
