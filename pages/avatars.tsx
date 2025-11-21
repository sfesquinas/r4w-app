// pages/avatars.tsx
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
  const [points, setPoints] = useState(0)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }

      // 1) Cargamos avatares
      const { data: avatarsData, error: avatarsError } = await supabase
        .from('avatars')
        .select<Avatar>('id, name, image_url, base_unlocked, required_points')
        .order('required_points', { ascending: true })

      if (avatarsError) {
        console.error(avatarsError)
        setMsg('Error cargando avatares: ' + avatarsError.message)
        return
      }
      setAvatars(avatarsData || [])

      // 2) Calculamos puntos del usuario (nº de respuestas correctas)
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select<AnswerRow>('is_correct')
        .eq('user_id', session.user.id)

      if (answersError) {
        console.error(answersError)
        // no cortamos la pantalla si falla esto, solo no mostramos puntos
        return
      }

      const totalPoints = (answersData || []).filter(a => a.is_correct).length
      setPoints(totalPoints)
    })()
  }, [])

  async function selectAvatar(avatar: Avatar) {
    setMsg('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/'
      return
    }

    const isUnlocked =
      avatar.base_unlocked || points >= avatar.required_points

    if (!isUnlocked) {
      setMsg('Este avatar todavía está bloqueado.')
      return
    }

    // 👇 IMPORTANTE: solo usamos avatar_id, NADA de avatar_code
    const { error } = await supabase
      .from('user_avatars')
      .upsert(
        {
          user_id: session.user.id,
          avatar_id: avatar.id,
          unlocked_at: new Date().toISOString(),
          source: 'manual'
        },
        { onConflict: 'user_id' } // un avatar activo por usuario
      )

    if (error) {
      console.error(error)
      setMsg('Error guardando avatar: ' + error.message)
      return
    }

    setMsg('✅ Avatar actualizado')
  }

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1>Elige tu avatar</h1>
      <p>Toque para seleccionar. Se guardará en tu perfil.</p>

      <p style={{ marginTop: 8 }}>
        <strong>Tus puntos actuales:</strong> {points}
      </p>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      {avatars.length === 0 && !msg && <p>Cargando…</p>}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          marginTop: 24
        }}
      >
        {avatars.map(av => {
          const isUnlocked =
            av.base_unlocked || points >= av.required_points

          return (
            <div
              key={av.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 16,
                padding: 12,
                width: 190,
                textAlign: 'center',
                opacity: isUnlocked ? 1 : 0.4,
                background: '#fff'
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 140,
                  margin: '0 auto 8px',
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: '#f3f3f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={av.image_url}
                  alt={av.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>

              <div style={{ fontWeight: 600, marginBottom: 4 }}>{av.name}</div>

              <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
                {av.base_unlocked
                  ? 'Disponible desde el inicio'
                  : `Necesitas ${av.required_points} puntos`}
              </div>

              <button
                onClick={() => selectAvatar(av)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #333',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  background: isUnlocked ? '#111' : '#eee',
                  color: isUnlocked ? '#fff' : '#666'
                }}
                disabled={!isUnlocked}
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
