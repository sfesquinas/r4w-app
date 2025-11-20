import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type Avatar = {
  id: string
  name: string
  image_url: string
  base_unlocked: boolean
  required_points: number
}

type AvatarWithStatus = Avatar & {
  unlocked: boolean
  remaining: number
}

type AnswerRow = {
  is_correct: boolean
}

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<AvatarWithStatus[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState(0)

  useEffect(() => {
    (async () => {
      // 1) comprobar sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }

      // 2) calcular puntos del usuario (nº de respuestas correctas)
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select<AnswerRow>('is_correct')
        .eq('user_id', session.user.id)

      if (answersError) {
        console.error(answersError)
        setMsg('Error calculando tus puntos: ' + answersError.message)
        setLoading(false)
        return
      }

      const correctCount = (answers || []).filter(a => a.is_correct).length
      setPoints(correctCount)

      // 3) leer catálogo de avatares
      const { data, error } = await supabase
        .from('avatars')
        .select<Avatar>('id, name, image_url, base_unlocked, required_points')
        .order('required_points', { ascending: true })

      if (error) {
        console.error(error)
        setMsg('Error cargando avatares: ' + error.message)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setMsg('No hay avatares configurados.')
        setLoading(false)
        return
      }

      // 4) calcular si cada avatar está desbloqueado o no
      const withStatus: AvatarWithStatus[] = data.map(av => {
        const unlocked = av.base_unlocked || correctCount >= av.required_points
        const remaining = av.base_unlocked
          ? 0
          : Math.max(av.required_points - correctCount, 0)

        return { ...av, unlocked, remaining }
      })

      setAvatars(withStatus)
      setLoading(false)
    })()
  }, [])

  async function selectAvatar(av: AvatarWithStatus) {
    setMsg('')

    // si no está desbloqueado, no dejamos seleccionarlo
    if (!av.unlocked) {
      setMsg(`❌ Aún no has desbloqueado este avatar. Te faltan ${av.remaining} puntos.`)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/'
      return
    }

    const { error } = await supabase
      .from('user_avatars')
      .upsert(
        {
          user_id: session.user.id,
          avatar_id: av.id,
          source: 'manual',           // opcional, por si quieres saber de dónde viene
          unlocked_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error(error)
      setMsg('Error guardando avatar: ' + error.message)
      return
    }

    setMsg('✅ Avatar actualizado')
  }

  return (
    <main style={{maxWidth:900, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Elige tu avatar</h1>
      <p>Toque para seleccionar. Se guardará en tu perfil.</p>

      <p style={{marginTop:8, fontSize:14}}>
        Tus puntos actuales: <strong>{points}</strong>
      </p>

      {loading && <p style={{marginTop:12}}>Cargando…</p>}

      {msg && <p style={{marginTop:12}}>{msg}</p>}

      <div style={{display:'flex', flexWrap:'wrap', gap:16, marginTop:24}}>
        {avatars.map(av => (
          <div
            key={av.id}
            style={{
              border:'1px solid #ddd',
              borderRadius:16,
              padding:12,
              width:160,
              textAlign:'center',
              opacity: av.unlocked ? 1 : 0.55,
              position:'relative'
            }}
          >
            <img
              src={av.image_url}
              alt={av.name}
              style={{
                width:120,
                height:120,
                borderRadius:12,
                objectFit:'cover',
                marginBottom:8,
                border: av.unlocked ? '2px solid #6b4eff' : '2px solid #ccc'
              }}
            />
            <div style={{fontWeight:600, marginBottom:4}}>{av.name}</div>

            <div style={{fontSize:12, color:'#555', marginBottom:8}}>
              {av.base_unlocked
                ? 'Disponible desde el inicio'
                : av.unlocked
                  ? `Desbloqueado con ${av.required_points} puntos`
                  : `Necesitas ${av.required_points} puntos (te faltan ${av.remaining})`}
            </div>

            <button
              onClick={() => selectAvatar(av)}
              style={{
                padding:'6px 10px',
                borderRadius:8,
                cursor: av.unlocked ? 'pointer' : 'not-allowed',
                backgroundColor: av.unlocked ? '#000' : '#999',
                color:'#fff',
                border:'none'
              }}
              disabled={!av.unlocked}
            >
              {av.unlocked ? 'Seleccionar' : 'Bloqueado'}
            </button>
          </div>
        ))}
      </div>

      <p style={{marginTop:24}}>
        <Link href="/dashboard">Volver al panel</Link>
      </p>
    </main>
  )
}
