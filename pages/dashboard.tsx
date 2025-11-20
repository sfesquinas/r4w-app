import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type Profile = {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  wisher_number: number | null
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // si no hay sesión, mandamos a la pantalla de login
        window.location.href = '/'
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, wisher_number')
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        console.error(error)
        setMsg('Error cargando tu perfil')
      } else {
        setProfile(data as Profile)
      }

      setLoading(false)
    })()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <main style={{maxWidth:720, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
        <h1>Panel</h1>
        <p>Cargando perfil…</p>
      </main>
    )
  }

  return (
    <main style={{maxWidth:720, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Panel</h1>

      {/* Bloque de usuario */}
      <section style={{display:'flex', alignItems:'center', marginTop:24, gap:16}}>
        <div style={{width:96, height:96, borderRadius:24, overflow:'hidden', background:'#f5f5f5'}}>
          {profile?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt="Avatar"
              style={{width:'100%', height:'100%', objectFit:'cover'}}
            />
          )}
        </div>

        <div>
          <p style={{margin:0, fontSize:18, fontWeight:600}}>
            {profile?.display_name || 'Sin nombre'}
          </p>

          {/* Wisher.X */}
          <p style={{margin:'4px 0', fontSize:14, color:'#555'}}>
            {profile?.wisher_number
              ? `Wisher.${profile.wisher_number}`
              : 'Wisher.?'}
          </p>

          <p style={{margin:'4px 0', fontSize:12, color:'#777'}}>
            ID: {profile?.user_id}
          </p>
        </div>
      </section>

      {/* Acciones */}
      <section style={{marginTop:32, display:'flex', flexDirection:'column', gap:12}}>
        <Link href="/answer" style={{color:'#2b0bbf', textDecoration:'underline', fontSize:16}}>
          Responder pregunta
        </Link>

        <Link href="/leaderboard" style={{color:'#2b0bbf', textDecoration:'underline', fontSize:16}}>
          Leaderboard
        </Link>

        <Link href="/avatars" style={{color:'#2b0bbf', textDecoration:'underline', fontSize:16}}>
          Cambiar avatar
        </Link>
      </section>

      {msg && (
        <p style={{marginTop:20, color:'crimson', fontSize:14}}>
          {msg}
        </p>
      )}

      <button
        onClick={signOut}
        style={{
          marginTop:32,
          padding:'10px 16px',
          borderRadius:8,
          border:'1px solid #333',
          background:'#fff',
          cursor:'pointer'
        }}
      >
        Cerrar sesión
      </button>
    </main>
  )
}
