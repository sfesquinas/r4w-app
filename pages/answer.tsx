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

export default function AvatarsPage() {
  const [email, setEmail] = useState('')
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const [points, setPoints] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (typeof window !== 'undefined') window.location.href = '/'
        return
      }

      setEmail(session.user.email ?? '')

      // 1) Perfil: avatar actual
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!profErr && prof) {
        setCurrentAvatar((prof as any).avatar_url ?? null)
      }

      // 2) Tus puntos (desde leaderboard)
      const { data: lb, error: lbErr } = await supabase
        .from('v_leaderboard_profile')
        .select('user_id, points')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!lbErr && lb) {
        setPoints((lb as any).points ?? 0)
      }

      // 3) Listado de avatares
      // 👇 OJO: aquí NO filtramos por base_unlocked
      const { data: avs, error: avErr } = await supabase
        .from('avatars')
        .select('id, name, image_url, base_unlocked, required_points')
        .order('required_points', { ascending: true })

      if (avErr) {
        console.error(avErr)
        setMsg('Error cargando avatares')
      } else if (avs) {
        setAvatars(avs as Avatar[])
      }

      setLoading(false)
    })()
  }, [])

  const handleSelect = async (avatar: Avatar, unlocked: boolean) => {
    setMsg('')
    if (!unlocked) {
      setMsg('🔒 Este avatar está bloqueado. Necesitas más puntos o futuros wishes.')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      if (typeof window !== 'undefined') window.location.href = '/'
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatar.image_url })
      .eq('user_id', session.user.id)

    if (error) {
      console.error(error)
      setMsg('Error guardando avatar: ' + error.message)
      return
    }

    setCurrentAvatar(avatar.image_url)
    setMsg('✅ Avatar actualizado')
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 780, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
        <p>Cargando avatares…</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 780, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1>Elige tu avatar</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>Sesión: <strong>{email}</strong></p>
      <p style={{ marginTop: 4, fontSize: 14 }}>Puntos actuales: <strong>{points}</strong></p>

      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          marginTop: 20
        }}
      >
        {avatars.map((av) => {
          const unlocked = av.base_unlocked || points >= av.required_points
          const isCurrent = currentAvatar === av.image_url

          return (
            <button
              key={av.id}
              onClick={() => handleSelect(av, unlocked)}
              style={{
                borderRadius: 12,
                padding: 10,
                border: isCurrent ? '2px solid #111' : '1px solid #ddd',
                background: unlocked ? '#fff' : '#f5f5f5',
                opacity: unlocked ? 1 : 0.5,
                cursor: unlocked ? 'pointer' : 'not-allowed',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <img
                  src={av.image_url}
                  alt={av.name}
                  width={100}
                  height={100}
                  style={{ borderRadius: 12, objectFit: 'cover' }}
                />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{av.name}</div>
              {av.required_points > 0 && (
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {unlocked
                    ? '🔓 Desbloqueado'
                    : `🔒 Requiere ${av.required_points} puntos`}
                </div>
              )}
              {isCurrent && (
                <div style={{ fontSize: 12, marginTop: 4, color: '#111' }}>
                  ✅ Seleccionado
                </div>
              )}
            </button>
          )
        })}
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/dashboard">Volver al panel</Link>
      </p>
    </main>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
