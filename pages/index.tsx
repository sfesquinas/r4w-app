// pages/index.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  // 1) Si ya hay sesión, ir al dashboard
  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session) {
        router.replace('/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkSession()

    // 2) Escuchar el callback del magic link y redirigir al crear sesión
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        router.replace('/dashboard')
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [router])

  async function signIn() {
    setMsg('Enviando enlace…')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // sin redirectTo -> usa tu NEXT_PUBLIC_SITE_URL de Vercel
    })
    setMsg(error ? 'Error: ' + error.message : '✅ Revisa tu email')
  }

  if (loading) {
    return (
      <main style={{maxWidth:520, margin:'60px auto', fontFamily:'system-ui', padding:'0 16px'}}>
        <p>Cargando…</p>
      </main>
    )
  }

  return (
    <main style={{maxWidth:520, margin:'60px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Run4Wish</h1>
      <p>Accede con tu email (Magic Link)</p>
      <input
        value={email}
        onChange={e=>setEmail(e.target.value)}
        placeholder="tu@email.com"
        style={{padding:'10px 12px', width:'100%', border:'1px solid #ccc', borderRadius:8}}
      />
      <button onClick={signIn} style={{marginTop:12, padding:'10px 14px', borderRadius:8}}>
        Entrar
      </button>
      {msg && <p style={{marginTop:10}}>{msg}</p>}
      <p style={{marginTop:24}}><a href="/dashboard">Ir al panel</a></p>
    </main>
  )
}
