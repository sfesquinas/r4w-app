import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Avatar = {
  id: string
  name: string
  image_url: string
  base_unlocked: boolean
  required_points: number
}

export default function DebugAvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [msg, setMsg] = useState('Cargando...')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMsg('Sin sesión')
        return
      }

      const { data, error } = await supabase
        .from('avatars')
        .select('id, name, image_url, base_unlocked, required_points')
        .order('required_points', { ascending: true })

      if (error) {
        console.error(error)
        setMsg('Error: ' + error.message)
        return
      }

      setAvatars(data || [])
      setMsg(`Total avatares: ${(data || []).length}`)
    })()
  }, [])

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1>Debug Avatars</h1>
      <p>{msg}</p>

      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, fontSize: 12, overflowX: 'auto' }}>
        {JSON.stringify(avatars, null, 2)}
      </pre>
    </main>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
