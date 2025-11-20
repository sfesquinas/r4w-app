// pages/dashboard.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type ProfileRow = {
  full_name: string | null
}

type AvatarFromJoin = {
  avatar: {
    id: string
    name: string
    image_url: string | null
  } | null
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/'
        return
      }

      const uid = session.user.id
      setUserId(uid)

      // 1) Perfil (nombre tipo Wisher.1)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', uid)
        .maybeSingle()

      if (profileError) {
        console.error(profileError)
        setMsg('Error cargando perfil')
      } else {
        setProfile(profileData as ProfileRow | null)
      }

      // 2) Avatar actual del usuario (user_avatars → avatars)
      const { data: uaData, error: uaError } = await supabase
        .from('user_avatars')
        .select('avatar:avatars(id, name, image_url)')
        .eq('user_id', uid)
        .maybeSingle()

      if (uaError) {
        console.error(uaError)
        // no bloqueamos nada si falla, solo usamos placeholder
      } else {
        const row = uaData as AvatarFromJoin | null
        const url = row?.avatar?.image_url || null
        setAvatarUrl(url)
      }

      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <main style={{maxWidth:800, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
        <h1>Panel</h1>
        <p>Cargando…</p>
      </main>
    )
  }

  const displayName = profile?.full_name || 'Wisher.?'
  const finalAvatarUrl =
    avatarUrl || 'https://placehold.co/200x200?text=A?'

  return (
    <main style={{maxWidth:800, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Panel</h1>

      <section style={{display:'flex', alignItems:'center', gap:24, marginTop:24}}>
        <img
          src={finalAvatarUrl}
          alt="Avatar actual"
          style={{
            width:160,
            height:160,
            borderRadius:24,
            objectFit:'cover',
            background:'#f3f3f3'
          }}
        />
        <div>
          {/* Nombre tipo Wisher.1 */}
          <h2 style={{fontSize:32, margin:'0 0 8px 0'}}>{displayName}</h2>

          {/* Si quieres volver a mostrar el email, descomenta esto:
          <p style={{margin:'0 0 4px 0', color:'#555'}}>{sessionEmail}</p>
          */}

          {userId && (
            <p style={{margin:0, color:'#777'}}>ID: {userId}</p>
          )}
        </div>
      </section>

      {msg && <p style={{marginTop:16}}>{msg}</p>}

      <nav style={{marginTop:32, display:'flex', flexDirection:'column', gap:12}}>
        <Link href="/answer">Responder pregunta</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/avatars">Cambiar avatar</Link>
      </nav>

      <button
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = '/'
        }}
        style={{marginTop:32, padding:'10px 16px', borderRadius:8}}
      >
        Cerrar sesión
      </button>
    </main>
  )
}
