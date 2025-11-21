import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type Avatar = {
  id: string
  name: string
  image_url: string
  base_unlocked: boolean
  required_points: number
}

type AnswerRow = {
  is_correct: boolean | null
}

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [points, setPoints] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/'
        return
      }

      // 1) Calcular puntos del usuario (1 punto por respuesta correcta)
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('is_correct')
        .eq('user_id', session.user.id)

      if (answersError) {
        console.error(answersError)
      } else if (answers) {
        const total = (answers as AnswerRow[]).reduce(
          (acc, a) => acc + (a.is_correct ? 1 : 0),
          0
        )
        setPoints(total)
      }

      // 2) Cargar catálogo de avatares
      const { data: avatarsData, error: avatarsError } = await supabase
        .from('avatars')
        .select('id, name, image_url, base_unlocked, required_points')
        .order('required_points', { ascending: true })

      if (avatarsError) {
        console.error(avatarsError)
        setMsg('Error cargando avatares: ' + avatarsError.message)
        return
      }

      setAvatars((avatarsData ?? []) as Avatar[])
    })()
  }, [])

  async function selectAvatar(
    avatar: Avatar
  ) {
    setMsg('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/'
      return
    }

    const currentPoints = points ?? 0

    // Bloqueo en cliente si no tiene puntos suficientes
    if (!avatar.base_unlocked && currentPoints < avatar.required_points) {
      setMsg('Aún no tienes puntos suficientes para este avatar.')
      return
    }

    // IMPORTANTE: solo usamos user_id y avatar_id
    const { error } = await supabase
      .from('user_avatars')
      .upsert(
        {
          user_id: session.user.id,
          avatar_id: avatar.id,
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

  const currentPoints = points ?? 0

  return (
    <main
      style={{
        maxWidth: 960,
        margin: '40px auto',
        fontFamily: 'system-ui',
        padding: '0 16px',
      }}
    >
      <h1>Elige tu avatar</h1>
      <p>Toque para seleccionar. Se guardará en tu perfil.</p>

      <p style={{ marginTop: 8 }}>
        <strong>Tus puntos actuales:</strong> {currentPoints}
      </p>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      {avatars.length === 0 && !msg && <p>Cargando…</p>}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 24,
        }}
      >
        {avatars.map((av) => {
          const unlocked = av.base_unlocked || currentPoints >= av.required_points

          return (
            <div
              key={av.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 16,
                padding: 12,
                width: 200,
                textAlign: 'center',
                opacity: unlocked ? 1 : 0.4,
                backgroundColor: '#fafafa',
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 140,
                  margin: '0 auto 8px',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#eee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={av.image_url}
                  alt={av.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>

              <div style={{ fontWeight: 600, marginBottom: 4 }}>{av.name}</div>
              <div
                style={{
                  fontSize: 12,
                  color: '#555',
                  marginBottom: 8,
                  minHeight: 32,
                }}
              >
                {av.base_unlocked
                  ? 'Disponible desde el inicio'
                  : `Necesitas ${av.required_points} puntos`}
              </div>

              <button
                onClick={() => selectAvatar(av)}
                disabled={!unlocked}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #333',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  backgroundColor: unlocked ? 'white' : '#f0f0f0',
                }}
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
