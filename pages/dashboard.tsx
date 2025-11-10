// pages/dashboard.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

type Profile = { full_name?: string; avatar_url?: string | null }

export default function Dashboard() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/')
        return
      }
      setEmail(session.user.email ?? null)

      // Carga perfil
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', session.user.id)
        .maybeSingle()
      setProfile(p ?? {})
      setLoading(false)
    }
    load()
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return <main style={{padding:24}}>Cargando…</main>

  return (
    <main style={{maxWidth:720, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Panel</h1>
      <p>Sesión: {email}</p>

      <div style={{marginTop:24, display:'flex', gap:16, alignItems:'center'}}>
        <img
          src={profile?.avatar_url ?? 'https://placehold.co/88x88?text=R4W'}
          alt="avatar"
          width={88}
          height={88}
          style={{borderRadius:8, border:'1px solid #ddd', objectFit:'cover'}}
        />
        <div>
          <div><strong>Nombre:</strong> {profile?.full_name ?? '—'}</div>
          <button
            onClick={() => router.push('/avatars')}
            style={{marginTop:8, padding:'8px 12px', borderRadius:8}}
          >
            Elegir avatar
          </button>
        </div>
      </div>

      <button onClick={signOut} style={{marginTop:24, padding:'10px 14px', borderRadius:8}}>
        Cerrar sesión
      </button>
    </main>
  )
}
