// pages/dashboard.tsx — Opción A (alias fijo + nombre público editable)
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type Profile = {
  full_name: string | null   // alias Wisher.N
  display_name: string | null
  avatar_url: string | null
}

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }
      setEmail(session.user.email ?? '')

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, display_name, avatar_url')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) { setMsg('No se pudo cargar tu perfil'); return }
      if (data) {
        setProfile(data as Profile)
        setDisplayName(data.display_name ?? '')
      }
    })()
  }, [])

  const saveDisplayName = async () => {
    setMsg('')
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/'; return }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName || null })
      .eq('user_id', session.user.id)

    setSaving(false)
    setMsg(error ? ('Error: ' + error.message) : '✅ Guardado')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <main style={{maxWidth:760, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Panel</h1>
      <p>Sesión: <strong>{email}</strong></p>

      {profile && (
        <section style={{display:'flex', gap:16, alignItems:'center', margin:'18px 0'}}>
          <img
            src={profile.avatar_url ?? 'https://placehold.co/96x96?text=R4W'}
            alt="avatar"
            width={96} height={96}
            style={{borderRadius:12, border:'1px solid #ddd', objectFit:'cover'}}
          />
          <div>
            <div><small>Alias (fijo)</small></div>
            <div style={{fontSize:20, fontWeight:700}}>{profile.full_name ?? 'Wisher'}</div>

            <div style={{marginTop:12}}>
              <label style={{display:'block', fontSize:12, opacity:0.7}}>Nombre público (opcional)</label>
              <input
                value={displayName}
                onChange={(e)=>setDisplayName(e.target.value)}
                placeholder="Tu nombre visible en rankings"
                style={{padding:'8px 10px', border:'1px solid #ccc', borderRadius:8, width:280}}
              />
              <button
                onClick={saveDisplayName}
                disabled={saving}
                style={{marginLeft:8, padding:'8px 12px', borderRadius:8, cursor:'pointer'}}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              {msg && <div style={{marginTop:8, fontSize:12}}>{msg}</div>}
            </div>
          </div>
        </section>
      )}

      <nav style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', marginTop:20}}>
        <Link href="/answer" className="btn">Responder pregunta</Link>
        <Link href="/leaderboard" className="btn">Leaderboard</Link>
        <Link href="/avatars" className="btn">Cambiar avatar</Link>
      </nav>

      <button onClick={signOut} style={{marginTop:24, padding:'10px 14px', borderRadius:8}}>
        Cerrar sesión
      </button>

      <style jsx>{`
        .btn { display:block; text-align:center; padding:12px 14px; border:1px solid #ccc; border-radius:10px; text-decoration:none }
        .btn:hover { background:#fafafa }
      `}</style>
    </main>
  )
}

export async function getServerSideProps() { return { props: {} } }
