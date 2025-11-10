import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type Profile = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

export default function Dashboard() {
  const [email, setEmail] = useState<string>('')
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }
      setEmail(session.user.email || '')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      setProfile(data as Profile | null)
    })()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <main style={{maxWidth:720, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Panel</h1>
      <p>Sesión: <strong>{email}</strong></p>

      {profile && (
        <div style={{display:'flex', gap:16, alignItems:'center', margin:'16px 0'}}>
          {profile.avatar_url && <img src={profile.avatar_url} alt="avatar" width={72} height={72} style={{borderRadius:12}} />}
          <div>
            <div><strong>{profile.full_name || 'Sin nombre'}</strong></div>
            <small>ID: {profile.user_id}</small>
          </div>
        </div>
      )}

      <div style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', marginTop:20}}>
        <Link href="/answer" className="btn">Responder pregunta</Link>
        <Link href="/leaderboard" className="btn">Leaderboard</Link>
        <Link href="/avatars" className="btn">Cambiar avatar</Link>
      </div>

      <button onClick={logout} style={{marginTop:24, padding:'10px 14px', borderRadius:8}}>Cerrar sesión</button>

      <style jsx>{`
        .btn { display:block; text-align:center; padding:12px 14px; border:1px solid #ccc; border-radius:10px; text-decoration:none }
        .btn:hover { background:#fafafa }
      `}</style>
    </main>
  )
}
