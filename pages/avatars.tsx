import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type CatalogAvatar = {
  id: string
  name: string
  image_url: string
  base_unlocked: boolean
  required_points: number
}

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<CatalogAvatar[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true)
      setMsg('')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }

      // 1) catálogo completo
      const { data: catalog, error: catError } = await supabase
        .from('avatars_catalog')
        .select('*')
        .order('required_points', { ascending: true })

      if (catError || !catalog) {
        setMsg('Error cargando avatares')
        setLoading(false)
        return
      }

      setAvatars(catalog as CatalogAvatar[])

      // 2) avatar actual del usuario
      const { data: ua, error: uaError } = await supabase
        .from('user_avatars')
        .select('avatar_id')
        .eq('user_id', session.user.id)
        .eq('is_current', true)
        .maybeSingle()

      if (!uaError && ua && ua.avatar_id) {
        setCurrentId(ua.avatar_id as string)
      }

      setLoading(false)
    })()
  }, [])

  async function selectAvatar(avatarId: string) {
    setMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/'
      return
    }

    setMsg('Guardando...')

    // Ponemos todos en false y este en true.
    // (si la estructura es distinta, luego ajustamos, pero así debería valer
    // para user_avatars con columnas user_id, avatar_id, is_current)
    const userId = session.user.id

    await supabase
      .from('user_avatars')
      .update({ is_current: false })
      .eq('user_id', userId)

    const { error: upsertError } = await supabase
      .from('user_avatars')
      .upsert(
        {
          user_id: userId,
          avatar_id: avatarId,
          is_current: true,
          unlocked_at: new Date().toISOString(),
        } as any,
        { onConflict: 'user_id,avatar_id' }
      )

    if (upsertError) {
      setMsg('Error guardando avatar: ' + upsertError.message)
      return
    }

    setCurrentId(avatarId)
    setMsg('✅ Avatar actualizado')
  }

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

      {loading && <p>Cargando avatares…</p>}

      {!loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginTop: 24,
          }}
        >
          {avatars.map((av) => {
            const isCurrent = currentId === av.id

            return (
              <div
                key={av.id}
                style={{
                  border: isCurrent ? '3px solid #7C3AED' : '1px solid #ddd',
                  borderRadius: 16,
                  padding: 12,
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    width: 140,
                    height: 140,
                    margin: '0 auto 8px',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#f3f3f3',
                  }}
                >
                  <img
                    src={av.image_url}
                    alt={av.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{av.name}</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
                  {av.required_points > 0
                    ? `Requiere ${av.required_points} puntos`
                    : 'Disponible desde el inicio'}
                </div>
                <button
                  onClick={() => selectAvatar(av.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isCurrent ? '#7C3AED' : '#111827',
                    color: '#fff',
                    fontSize: 14,
                  }}
                >
                  {isCurrent ? 'Avatar actual' : 'Seleccionar'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}

      <p style={{ marginTop: 32 }}>
        <Link href="/dashboard">Volver al panel</Link>
      </p>
    </main>
  )
}
