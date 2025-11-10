'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Avatar = {
  id: string
  name: string
  url: string
  unlock_points: number
}

export default function AvatarPicker(){
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  useEffect(()=>{
    async function loadAvatars(){
      const { data, error } = await supabase.from('avatars').select('*')
      if (!error && data) setAvatars(data)
    }
    loadAvatars()
  },[])

  async function handleSelect(avatar: Avatar){
    try{
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return alert('Inicia sesión primero')

      const { error } = await supabase.rpc('set_current_avatar', {
        p_user_id: user.id,
        p_avatar_code: avatar.name,
        p_avatar_url: avatar.url
      })
      if (error) throw error

      setSelected(avatar.name)
      setMessage(`✅ Avatar "${avatar.name}" activado`)
    }catch(err:any){
      console.error(err)
      setMessage('Error al actualizar avatar')
    }
  }

  return(
    <section style={{marginTop:30}}>
      <h3>Elige tu avatar</h3>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(100px,1fr))',
        gap:16
      }}>
        {avatars.map(a=>(
          <div key={a.id} style={{
            border:'2px solid #ddd', borderRadius:12, padding:8,
            textAlign:'center', cursor:'pointer',
            background:selected===a.name?'#f5f5f5':'white'
          }}
          onClick={()=>handleSelect(a)}>
            <img src={a.url} alt={a.name} width={80} height={80} style={{borderRadius:'50%', objectFit:'cover'}}/>
            <div style={{fontSize:12, marginTop:6}}>{a.name}</div>
          </div>
        ))}
      </div>
      {message && <p style={{marginTop:10, color:'#555'}}>{message}</p>}
    </section>
  )
}
