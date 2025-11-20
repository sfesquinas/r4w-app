// pages/dashboard.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type ProfileRow = {
  full_name: string | null
}

type UserAvatarRow = {
  avatar_id: string | null
}

type AvatarRow = {
  id: string
  name: string
  image_url: string
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('Wisher')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)

      // 1) Comprobar sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }

      setEmail(session.user.email ?? null)

      const userId = session.user.id

      // 2) Cargar nombre de perfil (Wisher.1, Wisher.2…)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select<ProfileRow>('full_name')
        .eq('user_id', userId)
        .maybeSingle()

      if (!profileError && profile && profile.full_name) {
        setDisplayName(profile.full_name)
      } else {
        setDisplayName('Wisher')
      }

      // 3) Cargar avatar seleccionado desde user_avatars + avatars
      const { data: uaRows, error: uaError } = await supabase
        .from('user_avatars')
        .select<UserAvatarRow>('avatar_id')
        .eq('user_id', userId)

      if (!uaError && uaRows && uaRows.length > 0 && uaRows[0].avatar_id) {
        const avatarId = uaRows[0].avatar_id

        const { data: avatar, error: avatarError } = await supabase
          .from('avatars')
          .select<AvatarRow>('id, name, image_url')
          .eq('id', avatarId)
          .maybeSingle()

        if (!avatarError && avatar && avatar.image_url) {
          setAvatarUrl(avatar.image_url)
        }
      }

      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <main style={{maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px'}}>
        <h1>Panel</h1>
        <p>Cargando…</p>
      </main>
    )
  }

  return (
    <main style={{maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px'}}>
      <h1>Panel</h1>

      <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 24}}>
        {/* Avatar grande */}
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 24,
            background: '#f3f3f3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar actual"
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          ) : (
            <span style={{fontSize: 72, fontWeight: 700, color: '#777'}}>A1</span>
          )}
        </div>

        {/* Datos de usuario */}
        <div>
          <h2 style={{margin: 0}}>Whising4World</h2>
          <p style={{margin: '4px 0', fontSize: 18}}>{displayName}</p>
          {email && (
            <p style={{margin: '4px 0', color: '#666', fontSize: 14}}>
              Email: {email}
            </p>
          )}
        </div>
      </div>

      <div style={{marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12}}>
        <Link href="/answer">Responder pregunta</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/avatars">Cambiar avatar</Link>
      </div>

      <button
        style={{
          marginTop: 40,
          padding: '10px 18px',
          borderRadius: 10,
          border: '1px solid #000',
          background: '#f5f5f5',
          cursor: 'pointer'
        }}
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = '/'
        }}
      >
        Cerrar sesión
      </button>
    </main>
  )
}
