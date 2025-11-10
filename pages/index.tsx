import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')

  async function signIn() {
    setMsg('Enviando enlace…')

    // URL base dinámica (local o Vercel)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://r4w-app.vercel.app'

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/dashboard`,
      },
    })

    setMsg(error ? '❌ Error: ' + error.message : '✅ Revisa tu email')
  }

  return (
    <main
      style={{
        maxWidth: 520,
        margin: '60px auto',
        fontFamily: 'system-ui',
        padding: '0 16px',
        textAlign: 'center',
      }}
    >
      <h1>Run4Wish</h1>
      <p>Accede con tu email (Magic Link)</p>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        style={{
          padding: '10px 12px',
          width: '100%',
          border: '1px solid #ccc',
          borderRadius: 8,
        }}
      />

      <button
        onClick={signIn}
        style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Entrar
      </button>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

      <p style={{ marginTop: 24 }}>
        <a href="/dashboard">Ir al panel</a>
      </p>
    </main>
  )
}
