// pages/dashboard.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/')
        return
      }
      setEmail(session.user.email ?? null)
    }
    run()
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <main style={{maxWidth:720, margin:'60px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Panel</h1>
      <p>Sesión: {email ?? '...'}</p>
      <button onClick={signOut} style={{marginTop:12, padding:'10px 14px', borderRadius:8}}>
        Cerrar sesión
      </button>
    </main>
  )
}
