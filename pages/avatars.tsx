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

type AnswerRow = {
  is_correct: boolean
}

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [msg, setMsg] = useState('')
  const [points, setPoints] = useState(0)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }

      // 1) PUNTOS DEL USUARIO (respuestas correctas)
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('is_correct')        // <- sin genérico, solo el nombre de la columna
        .eq('user_id', session.user.id)

      if (answersError) {
        console.error(answersError)
      } else if (answers) {
        const rows = answers as AnswerRow[]
        const totalCorrect = rows.filter(a => a.is_correct).length
        setPoints(totalCorrect)
      }

      // 2) AVATARES DISPONIBLES
      const { data, error } = await supabase
        .from('avatars')
        .select('id, name, image_url, base_unlocked, required_points')
        .order('required_points', { ascending: true })

      if (error) {
        console.error(error)
        setMsg('Error cargando avatares: ' + error.message)
        return
      }

      if (!data || data.length === 0) {
        setMsg('No hay avatares configurados.')
        return
      }

      setAvatars(data as Avatar[])
    })()
  }, [])

  async function selectAvatar(avatarId: string) {
    setMsg('Guardando avatar…')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/'
      return
    }

    const avatar = avatars.find(a => a.id === avatarId)
    if (!avatar) {
      setMsg('Avatar no encontrado')
      return
    }

    // LÓGICA DE DESBLOQUEO
    if (!avatar.base_unlocked && points < avatar.required_points) {
      setMsg(`⚠️ Necesitas ${avatar.required_points} puntos para desbloquear este avatar.`)
      return
    }

    const { error } = await supabase
      .from('user_avatars')
      .upsert(
        {
          user_id: session.user.id,
          avatar_id: avatarId,
          avatar_code: null,    // ya no usamos avatar_code, pero la columna existe
          source: 'manual'
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
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1>Elige tu avatar</h1>
      <p>Toque para seleccionar. Se guardará en tu perfil.</p>

      <p style={{ marginTop: 8 }}>Tus puntos actuales: <strong>{points}</strong></p>

      {avatars.length === 0 && !msg && <p>Cargando…</p>}

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 24 }}>
        {avatars.map(av => {
          const unlocked = av.base_unlocked || points >= av.required_points

          return (
            <div
              key={av.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 16,
                padding: 12,
                width: 160,
                textAlign: 'center',
                opacity: unlocked ? 1 : 0.5
              }}
            >
              <img
                src={av.image_url}
                alt={av.name}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  objectFit: 'cover',
                  marginBottom: 8
                }}
              />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{av.name}</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
                {av.base_unlocked
                  ? 'Disponible desde el inicio'
                  : `Necesitas ${av.required_points} puntos`}
              </div>
              <button
                onClick={() => selectAvatar(av.id)}
                style={{ padding: '6px 10px', borderRadius: 8 }}
              >
                Seleccionar
              </button>
            </div>
          )
        })}
      </div>

      <p style={{ marginTop: 24 }}>
        <Link href="/dashboard">Volver al panel</Link>
      </p>
    </main>
  )
}
