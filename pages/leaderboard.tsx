// pages/leaderboard.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type Row = {
  user_id: string
  points: number
  last_answer_at: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
}

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }

      const { data, error } = await supabase
        .from('v_leaderboard_profile')
        .select('user_id, points, last_answer_at, display_name, full_name, avatar_url')
        .limit(50)

      if (error) {
        console.error(error)
        setMsg('Error cargando leaderboard')
        return
      }

      setRows((data || []) as Row[])
    })()
  }, [])

  return (
    <main style={{maxWidth:800, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Leaderboard</h1>
      {msg && <p style={{color:'#b00'}}>{msg}</p>}

      <ol style={{marginTop:16, paddingLeft:20}}>
        {rows.map((r, i) => {
          const name =
            r.display_name?.trim() ||
            r.full_name?.trim() ||
            `Wisher.${r.user_id.slice(0,6)}`

          return (
            <li key={r.user_id}
                style={{display:'flex', gap:12, alignItems:'center', margin:'10px 0'}}>
              {r.avatar_url
                ? <img src={r.avatar_url} width={40} height={40}
                       style={{borderRadius:8, objectFit:'cover', border:'1px solid #eee'}} alt="avatar"/>
                : <div style={{width:40, height:40, borderRadius:8, background:'#eee'}} />
              }

              <div style={{flex:1}}>
                <strong>#{i+1}</strong> {name}
              </div>

              <div style={{minWidth:70, textAlign:'right'}}>
                <strong>{r.points}</strong> pts
              </div>
            </li>
          )
        })}
      </ol>

      <p style={{marginTop:24}}>
        <Link href="/dashboard">Volver al panel</Link>
      </p>
    </main>
  )
}

export async function getServerSideProps() { return { props: {} } }
