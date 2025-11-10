'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Catalog = { code:string; name:string; url:string; is_default:boolean; unlock_type:string|null }
type Mine = { avatar_code:string }

const SUPABASE_PUBLIC = 'https://uiwhbimgqfcgqrrdomed.supabase.co' // ← CAMBIA XXXX por tu URL de Supabase

export default function AvatarPicker(){
  const [catalog, setCatalog] = useState<Catalog[]>([])
  const [mine, setMine] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  async function load(){
    setMsg('')
    // catálogo (público)
    const { data: cat, error: e1 } = await supabase
      .from('avatars_catalog')
      .select('code,name,url,is_default,unlock_type')
      .order('is_default', { ascending: false })
    if (e1) { setMsg('Error catálogo: '+e1.message); return }
    setCatalog(cat || [])

    // mis avatares desbloqueados (requiere sesión)
    const { data: ua, error: e2 } = await supabase
      .from('user_avatars')
      .select('avatar_code')
    if (!e2 && ua) setMine(ua.map(r=>r.avatar_code))
  }

  useEffect(()=>{ load() }, [])

  async function unlockForTest(code:string){
    setMsg('Otorgando avatar…')
    const { error } = await supabase.rpc('grant_avatar', { p_avatar_code: code })
    if (error) { setMsg('Error: '+error.message); return }
    setMsg('Avatar desbloqueado ✅')
    load()
  }

  async function useAvatar(code:string){
    setMsg('Aplicando avatar…')
    const { error } = await supabase.rpc('set_current_avatar', { p_avatar_code: code })
    if (error) { setMsg('Error: '+error.message); return }
    setMsg('Avatar actualizado ✅')
  }

  const publicUrl = (path:string)=> `${SUPABASE_PUBLIC}/storage/v1/object/public/${path}`

  return (
    <section style={{border:'1px solid #eee', borderRadius:12, padding:16}}>
      <h3>Elegir avatar</h3>
      {msg && <p>{msg}</p>}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12}}>
        {catalog.map(item=>{
          const isMine = item.is_default || mine.includes(item.code)
          return (
            <div key={item.code} style={{border:'1px solid #ddd', borderRadius:10, padding:10}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <img src={publicUrl(item.url)} alt={item.name} width={48} height={48} style={{borderRadius:8, objectFit:'cover'}}/>
                <div>
                  <strong>{item.name}</strong>
                  <div style={{fontSize:12, opacity:0.7}}>
                    {item.is_default ? 'Básico' : (item.unlock_type === 'badge' ? 'Desbloqueable (insignia)' : 'Desbloqueable')}
                  </div>
                </div>
              </div>

              <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                {!item.is_default && !isMine && (
                  <button onClick={()=>unlockForTest(item.code)} style={{padding:'8px 10px', borderRadius:8}}>
                    Desbloquear (prueba)
                  </button>
                )}
                {isMine && (
                  <button onClick={()=>useAvatar(item.code)} style={{padding:'8px 10px', borderRadius:8}}>
                    Usar este avatar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
