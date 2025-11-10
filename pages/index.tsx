// pages/index.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [cooldown, setCooldown] = useState(0)

  // Redirige si ya hay sesión o cuando llega el magic link
  useEffect(() => {
    let mounted = true

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session) router.replace('/dashboard')
      else setLoading(false)
    }
    check()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace('/dashboard')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  // Tick de la cuenta atrás
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function signIn() {
    if (cooldown > 0) return
    setMsg('Enviando enlace…')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      // Si el mensaje trae “after XX seconds”, arrancamos cooldown
      const m = error.message.match(/after\s+(\d+)\s+seconds/i)
      if (m) {
        setCooldown(parseInt(m[1], 10))
        setMsg('Por seguridad, espera ' + m[1] + ' segundos para volver a pedirlo.')
      } else {
        setMsg('Error: ' + error.message)
      }
    } else {
      setMsg('✅ Enlace enviado. Revisa tu email.')
    }
  }

  if (loading) {
    return <main style={{maxWidth:520, margin:'60px auto', fontFamily:'system-ui', padding:'0 16px'}}>Cargando…</main>
  }

  const disabled = !email || cooldown > 0

  return (
    <main style={{maxWidth:520, margin:'60px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Run4Wish</h1>
      <p>Accede con tu email (Magic Link)</p>

      <input
        value={email}
        onChange={e=>setEmail(e.target.value)}
        placeholder="tu@email.com"
        type="email"
        style={{padding:'10px 12px', width:'100%', border:'1px solid #ccc', borderRadius:8}}
      />

      <button onClick={signIn} disabled={disabled}
        style={{
          marginTop:12, padding:'10px 14px', borderRadius:8,
          opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer'
        }}>
        {cooldown > 0 ? `Espera ${cooldown}s…` : 'Entrar'}
      </button>

      {msg && <p style={{marginTop:10}}>{msg}</p>}

      <p style={{marginTop:24}}><a href="/dashboard">Ir al panel</a></p>
    </main>
  )
}
