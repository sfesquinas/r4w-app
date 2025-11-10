import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

type Question = {
  id: string
  prompt: string
  options: string[]        // almacenado como jsonb en la tabla
  correct_index: number
  category: string | null
}

export default function AnswerPage() {
  const [q, setQ] = useState<Question | null>(null)
  const [choice, setChoice] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }

      // Traemos 1 pregunta aleatoria (puedes cambiarlo por “la del día” cuando quieras)
      const { data, error } = await supabase
        .from('questions')
        .select('id, prompt, options, correct_index, category')
        .order('random()', { ascending: true })
        .limit(1)

      if (error) { setMsg('Error cargando pregunta'); return }
      if (data && data.length) setQ(data[0] as unknown as Question)
    })()
  }, [])

  async function submit() {
    if (!q || choice === null) { setMsg('Selecciona una opción'); return }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/'; return }

    const correct = choice === q.correct_index

    const { error } = await supabase.from('answers').insert({
      user_id: session.user.id,
      question_id: q.id,
      selected_index: choice,
      is_correct: correct
    })

    setMsg(error ? ('Error guardando: ' + error.message) :
      (correct ? '✅ ¡Correcta!' : '❌ No es correcta'))
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
