import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type Question = {
  id: string
  prompt: string
  options: string[]
  correct_index: number
  category: string | null
  day?: string      // opcional, por si quieres usarlo después
}

export default function AnswerPage() {
  const [q, setQ] = useState<Question | null>(null)
  const [choice, setChoice] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }

      // Traemos la pregunta del día (misma para todo el mundo)
      const { data, error } = await supabase.rpc('r4w_today_question')

      if (error) {
        console.error(error)
        setMsg('Error cargando pregunta: ' + error.message)
        return
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setMsg('No hay pregunta disponible hoy')
        return
      }

      const row = Array.isArray(data) ? data[0] : data

      setQ({
        id: row.id,
        prompt: row.prompt,
        options: row.options,
        correct_index: row.correct_index,
        category: row.category,
        day: row.day
      })
    })()
  }, [])

    async function submit() {
    if (!q || choice === null) { 
      setMsg('Selecciona una opción'); 
      return; 
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/'; return }

    const correct = choice === q.correct_index

    // Fecha del día (YYYY-MM-DD) para answer_date
    const todayStr = new Date().toISOString().slice(0, 10)

    const { error } = await supabase.from('answers').insert({
      user_id: session.user.id,
      question_id: q.id,
      selected_index: choice,
      is_correct: correct,
      answer_date: todayStr
    })

    if (error) {
      console.error(error)
      // Si es por la unique (ya respondió hoy)
      // código típico de Postgres: 23505
      // @ts-ignore
      if (error.code === '23505') {
        setMsg('🥇 Ya has respondido hoy. Vuelve mañana para seguir avanzando.')
      } else {
        setMsg('Error guardando: ' + error.message)
      }
      return
    }

    setMsg(correct ? '✅ ¡Correcta!' : '❌ No es correcta')
  }
  
  return (
    <main style={{maxWidth:720, margin:'40px auto', fontFamily:'system-ui', padding:'0 16px'}}>
      <h1>Responder</h1>
      {q ? (
        <>
          <h3 style={{marginTop:10}}>{q.prompt}</h3>
          <ul style={{listStyle:'none', padding:0, marginTop:10}}>
            {q.options.map((opt, idx) => (
              <li key={idx} style={{margin:'8px 0'}}>
                <label style={{display:'block', border:'1px solid #ccc', borderRadius:10, padding:'10px 12px', cursor:'pointer'}}>
                  <input type="radio" name="opt" checked={choice===idx} onChange={()=>setChoice(idx)} />{' '}
                  {opt}
                </label>
              </li>
            ))}
          </ul>
          <button onClick={submit} style={{marginTop:12, padding:'10px 14px', borderRadius:8}}>Enviar</button>
        </>
      ) : <p>Cargando…</p>}

      {msg && <p style={{marginTop:12}}>{msg}</p>}
      <p style={{marginTop:24}}><Link href="/dashboard">Volver al panel</Link></p>
    </main>
  )
}
