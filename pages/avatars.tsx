// pages/avatars.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type CatalogAvatar = {
  id: string
  name: string
  image_url: string
  base_unlocked: boolean
  required_points: number
}

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<CatalogAvatar[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      setMsg('')
      setLoading(true)

      // 1) Comprobar sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }

      // 2) Cargar catálogo de avatares DESDE avatars_catalog
      const { data, error } = await supabase
        .from('avatars_catalog')
        .select('id, name, image_url, base_unlocked, required_points')
        .order('required_points', { ascending: true })

      if (error) {
        console.error('Error cargando avatares', error)
        setMsg('Error cargando avatares: ' + error.message)
        setAvatars([])
      } else {
        setAvatars((data || []) as CatalogAvatar[])
      }

      setLoading(false)
    })()
  }, [])

  async function selectAvatar(avatarId: string) {
    setMsg('Guardando avatar…')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/'
      return
    }

    const { error } = await supabase.from('user_avatars').upsert(
      {
        user_id: session.user.id,
        avatar_id: avatarId,
        is_current: true,
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      console.error('Error guardando avatar', error)
      setMsg('Error guardando avatar: ' + error.message)
    } else {
      setMsg('✅ Avatar actualizado')
    }
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

      {loading && <p>Cargando…</p>}

      {/* Solo mostramos "no hay avatares" si NO hay error */}
      {!loading && !msg && avatars.length === 0 && (
        <p>No hay avatares configurados.</p>
      )}

      {!loading && avatars.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
            marginTop: 24,
          }}
        >
          {avatars.map((av) => (
            <button
              key={av.id}
              onClick={() => selectAvatar(av.id)}
              style={{
                border: '1px solid #ddd',
                borderRadius: 16,
                padding: 12,
                cursor: 'pointer',
                textAlign: 'center',
                background: '#fff',
              }}
            >
              <img
                src={av.image_url}
                alt={av.name}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              />
              <div style={{ fontWeight: 600 }}>{av.name}</div>
              {!av.base_unlocked && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Requiere {av.required_points} puntos
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Aquí veremos el mensaje real del error */}
      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}

      <p style={{ marginTop: 24 }}>
        <Link href="/dashboard">Volver al panel</Link>
      </p>
    </main>
  )
}
