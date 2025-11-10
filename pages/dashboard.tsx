import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AvatarPicker from '../components/AvatarPicker'

export default function Dashboard(){
  const [profile, setProfile] = useState<any>(null)
  const [email, setEmail] = useState<string>('')

  useEffect(()=>{
    (async ()=>{
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setProfile(data || null)
      }
    })()
  }, [])

  return (
    <main style={{maxWidth:820, margin:'40px auto', padding:'0 16px', fontFamily:'system-ui'}}>
      <h2>Panel R4W</h2>
      <p>Sesión: {email || 'no iniciada'}</p>

      {profile && (
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt="Mi avatar" width={72} height={72} style={{borderRadius:12, objectFit:'cover'}}/>
          )}
          <div style={{fontSize:14, opacity:0.8}}>
            <div><strong>Avatar activo:</strong> {profile.avatar_code || '—'}</div>
            <div><strong>URL:</strong> {profile.avatar_url || '—'}</div>
          </div>
        </div>
      )}

      <AvatarPicker/>
    </main>
  )
}
