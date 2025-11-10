// pages/avatars.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

type Item = { name: string; url: string }

export default function Avatars() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      // Lista los archivos del bucket 'avatars' (carpeta raíz)
      const { data: files, error } = await supabase.storage.from('avatars').list('', { limit: 100 })
      if (error) return console.error(error)

      const withUrls =
        files?.filter(f => !f.name.endsWith('/')).map(f => {
          const { data } = supabase.storage.from('avatars').getPublicUrl(f.name)
          return { name: f.name, url: data.publicUrl }
        }) ?? []

      setItems(withUrls)
    }
    load()
  }, [])

  const choose = async (publicUrl: string) => {
    setSaving(publicUrl)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.replace('/')

    await supabase.from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', session.user.id)

    router.replace('/dashboard')
  }

  return (
    <main style={{maxWidth:900, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Elige tu avatar</h1>
      <p>Toque para seleccionar. Se guardará en tu perfil.</p>

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',
        gap:16, marginTop:16
      }}>
        {items.map(it => (
          <button key={it.name}
            onClick={() => choose(it.url)}
            style={{
              padding:0, border:'1px solid #ddd', borderRadius:8, overflow:'hidden',
              cursor:'pointer', background:'#fff'
            }}>
            <img src={it.url} alt={it.name} style={{width:'100%', height:140, objectFit:'cover'}} />
            <div style={{padding:8, fontSize:12}}>
              {saving === it.url ? 'Guardando…' : 'Seleccionar'}
            </div>
          </button>
        ))}
      </div>

      <p style={{marginTop:20}}><a href="/dashboard">Volver al panel</a></p>
    </main>
  )
}
