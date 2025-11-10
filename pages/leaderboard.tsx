import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type Row = { user_id: string; points: number; email?: string | null; avatar_url?: string | null }

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }

      // 1) Traemos el leaderboard
      const { data: lb, error } = await supabase.from('v_leaderboard').select('*').limit(50)
      if (error) { setMsg('Error cargando leaderboard'); return }

      // 2) Enriquecemos con avatar usando profiles
      const enriched: Row[] = []
      for (const r of (lb || []) as any[]) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', r.user_id)
          .maybeSingle()

        // email por auth.users no está abierto via RLS; si quieres mostrar email, usa tu propio profiles.email
        enriched.push({ user_id: r.user_id, points: r.points, avatar_url: prof?.avatar_url || null })
      }
      setRows(enriched)
    })()
  }, [])

  return (
    <main style={{maxWidth:720, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Leaderboard</h1>
      {msg && <p>{msg}</p>}

      <ol style={{marginTop:16}}>
        {rows.map((r, i) => (
          <li key={r.user_id} style={{display:'flex', gap:12, alignItems:'center', margin:'10px 0'}}>
            {r.avatar_url ? <img src={r.avatar_url} width={40} height={40} style={{borderRadius:8}}/> : <div style={{width:40,height:40,background:'#eee',borderRadius:8}}/>}
            <div style={{flex:1}}>
              <strong>Usuario {r.user_id.slice(0,8)}…</strong>
            </div>
            <div><strong>{r.points}</strong> pts</div>
          </li>
        ))}
      </ol>

      <p style={{marginTop:24}}><Link href="/dashboard">Volver al panel</Link></p>
    </main>
  )
}
