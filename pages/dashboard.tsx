import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type Profile = {
  full_name: string | null
  id: string
}

type Avatar = {
  id: string
  name: string
  image_url: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }

      const userId = session.user.id

      // 1️⃣ Cargar perfil
      const { data: pData, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_id', userId)
        .single()

      if (pErr) {
        console.error(pErr)
        setMsg('Error cargando perfil')
        return
      }

      setProfile({
        id: pData.user_id,
        full_name: pData.full_name
      })

      // 2️⃣ Buscar el avatar elegido por el usuario en user_avatars
      const { data: ua, error: uaErr } = await supabase
        .from('user_avatars')
        .select('avatar_id')
        .eq('user_id', userId)
        .single()

      if (uaErr) {
        console.error(uaErr)
        return
      }

      if (ua && ua.avatar_id) {
        // 3️⃣ Obtener el avatar real desde avatars
        const { data: avData, error: avErr } = await supabase
          .from('avatars')
          .select('id, name, image_url')
          .eq('id', ua.avatar_id)
          .single()

        if (avErr) {
          console.error(avErr)
          return
        }

        setAvatar(avData)
      }
    })()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <main style={{maxWidth:720, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>

      <h1>Panel</h1>

      {msg && <p>{msg}</p>}

      {profile && (
        <>
          <div style={{display:'flex', gap:16, alignItems:'center', marginTop:24}}>
            
            {/* Avatar real */}
            {avatar ? (
              <img
                src={avatar.image_url}
                alt={avatar.name}
                style={{width:120, height:120, borderRadius:20, objectFit:'cover'}}
              />
            ) : (
              <div style={{width:120, height:120, borderRadius:20, background:'#eee'}}></div>
            )}

            <div>
              <h2>{profile.full_name}</h2>
              <p style={{color:'#666'}}>ID: {profile.id}</p>
            </div>
          </div>

          <p style={{marginTop:30}}>
            <Link href="/answer">Responder pregunta</Link>
          </p>
          <p><Link href="/leaderboard">Leaderboard</Link></p>
          <p><Link href="/avatars">Cambiar avatar</Link></p>

          <button onClick={logout}
            style={{marginTop:30, padding:'10px 14px', borderRadius:8}}>
            Cerrar sesión
          </button>
        </>
      )}

    </main>
  )
}
