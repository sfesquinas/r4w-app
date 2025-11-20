import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type Profile = {
  full_name: string | null   // alias Wisher.N
  display_name: string | null
  avatar_url: string | null
}

type LeaderRow = {
  user_id: string
  points: number
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
}

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  const [answeredToday, setAnsweredToday] = useState(false)
  const [correctToday, setCorrectToday] = useState<boolean | null>(null)

  const [points, setPoints] = useState<number | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [loadMsg, setLoadMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (typeof window !== 'undefined') window.location.href = '/'
        return
      }

      setEmail(session.user.email ?? '')

      // 1) Cargar perfil
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('full_name, display_name, avatar_url')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (profErr) {
        console.error(profErr)
        setLoadMsg('No se pudo cargar tu perfil')
      } else if (prof) {
        const p = prof as Profile
        setProfile(p)
        setDisplayName(p.display_name ?? '')
      }

      // 2) Comprobar si ha respondido hoy
      const todayStr = new Date().toISOString().slice(0, 10)

      const { data: ans, error: ansErr } = await supabase
        .from('answers')
        .select('id, is_correct')
        .eq('user_id', session.user.id)
        .eq('answer_date', todayStr)
        .maybeSingle()

      if (ansErr && ansErr.code !== 'PGRST116') {
        // PGRST116 = no rows found, no es error grave
        console.error(ansErr)
      } else if (ans) {
        setAnsweredToday(true)
        setCorrectToday((ans as any).is_correct === true)
      } else {
        setAnsweredToday(false)
        setCorrectToday(null)
      }

      // 3) Cargar ranking básico y posición del usuario
      const { data: lb, error: lbErr } = await supabase
        .from('v_leaderboard_profile')
        .select('user_id, points, display_name, full_name, avatar_url')
        .order('points', { ascending: false })
        .limit(50)

      if (lbErr) {
        console.error(lbErr)
      } else if (lb) {
        const rows = lb as LeaderRow[]
        const meIndex = rows.findIndex(r => r.user_id === session.user.id)
        if (meIndex >= 0) {
          setRank(meIndex + 1)
          setPoints(rows[meIndex].points)
        }
      }
    })()
  }, [])

  async function saveDisplayName() {
    setNameMsg('')
    setSavingName(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      if (typeof window !== 'undefined') window.location.href = '/'
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName || null })
      .eq('user_id', session.user.id)

    setSavingName(false)
    setNameMsg(error ? ('Error: ' + error.message) : '✅ Nombre público guardado')
  }

  async function signOut() {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  const alias = profile?.full_name ?? 'Wisher'
  const niceName = profile?.display_name?.trim() || alias

  return (
    <main style={{ maxWidth: 780, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 8 }}>Panel Run4Wish</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>Sesión: <strong>{email}</strong></p>

      {loadMsg && <p style={{ color: '#b00' }}>{loadMsg}</p>}

      {/* Bloque de perfil */}
      {profile && (
        <section style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '18px 0' }}>
          <img
            src={profile.avatar_url ?? 'https://placehold.co/96x96?text=R4W'}
            alt="avatar"
            width={96}
            height={96}
            style={{ borderRadius: 12, border: '1px solid #ddd', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Alias</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{alias}</div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>Nombre público (opcional)</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre visible en rankings"
                style={{ padding: '8px 10px', border: '1px solid #ccc', borderRadius: 8, width: 260 }}
              />
              <button
                onClick={saveDisplayName}
                disabled={savingName}
                style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
              >
                {savingName ? 'Guardando…' : 'Guardar'}
              </button>
              {nameMsg && <div style={{ marginTop: 4, fontSize: 12 }}>{nameMsg}</div>}
            </div>
          </div>
        </section>
      )}

      {/* Bloque estado del día */}
      <section
        style={{
          borderRadius: 12,
          padding: '14px 16px',
          marginTop: 8,
          background: answeredToday ? '#e5ffe9' : '#fff9e6',
          border: answeredToday ? '1px solid #9cd49f' : '1px solid #f0cf7b'
        }}
      >
        {answeredToday ? (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Reto de hoy completado ✅</h2>
            <p style={{ margin: 0, fontSize: 14 }}>
              {correctToday === true
                ? 'Has acertado la pregunta de hoy. ¡Sigue así, Wisher!'
                : 'Ya has respondido la pregunta de hoy. Mañana tienes otra oportunidad para sumar puntos.'}
            </p>
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Reto de hoy pendiente ⚡</h2>
            <p style={{ margin: '0 0 8px', fontSize: 14 }}>
              Aún no has respondido a la pregunta de hoy. Cada día que participas, avanzas en la carrera.
            </p>
            <Link
              href="/answer"
              style={{
                display: 'inline-block',
                marginTop: 4,
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: '#111',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14
              }}
            >
              Responder ahora
            </Link>
          </>
        )}
      </section>

      {/* Bloque ranking */}
      <section style={{ marginTop: 16, borderRadius: 12, padding: '14px 16px', border: '1px solid #eee' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Tu posición</h2>
        {points !== null ? (
          <p style={{ margin: 0, fontSize: 14 }}>
            {rank !== null ? (
              <>
                Estás en el puesto <strong>#{rank}</strong> con <strong>{points}</strong> puntos.
              </>
            ) : (
              <>
                Tienes <strong>{points}</strong> puntos acumulados.
              </>
            )}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>
            Aún no tienes puntos suficientes para aparecer en el ranking.
          </p>
        )}

        <p style={{ marginTop: 8, fontSize: 14 }}>
          <Link href="/leaderboard">Ver leaderboard completo</Link>
        </p>
      </section>

      {/* Navegación */}
      <section
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          marginTop: 20
        }}
      >
        <Link href="/answer" className="btn">Responder pregunta</Link>
        <Link href="/avatars" className="btn">Cambiar avatar</Link>
      </section>

      <button
        onClick={signOut}
        style={{ marginTop: 24, padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}
      >
        Cerrar sesión
      </button>

      <style jsx>{`
        .btn {
          display: block;
          text-align: center;
          padding: 12px 14px;
          border: 1px solid #ccc;
          border-radius: 10px;
          text-decoration: none;
        }
        .btn:hover { background: #fafafa; }
      `}</style>
    </main>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
