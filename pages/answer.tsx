import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type AnswerQuestion = {
  id: string
  prompt: string
  options: string[]
  correct_index: number
  category: string | null
  day?: string
}

export default function AnswerPage() {
  const [question, setQuestion] = useState<AnswerQuestion | null>(null)
  const [choice, setChoice] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
        return
      }

      // Pregunta del día (misma para todos)
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

      const row: any = Array.isArray(data) ? data[0] : data

      setQuestion({
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
    if (!question || choice === null) {
      setMsg('Selecciona una opción')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
      return
    }

    const correct = choice === question.correct_index
    const todayStr = new Date().toISOString().slice(0, 10)

    const { error } = await supabase.from('answers').insert({
      user_id: session.user.id,
      question_id: question.id,
      selected_index: choice,
      chosen_index: choice,    // usamos ambas columnas
      is_correct: correct,
      answer_date: todayStr
    })

    if (error) {
      console.error(error)
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
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1>Responder</h1>

      {!question && !msg && <p>Cargando…</p>}

      {question && (
        <>
          <h3 style={{ marginTop: 10 }}>{question.prompt}</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 10 }}>
            {question.options.map((opt, idx) => (
              <li key={idx} style={{ margin: '8px 0' }}>
                <label
                  style={{
                    display: 'block',
                    border: '1px solid #ccc',
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="opt"
                    checked={choice === idx}
                    onChange={() => setChoice(idx)}
                  />{' '}
                  {opt}
                </label>
              </li>
            ))}
          </ul>

          <button
            onClick={submit}
            style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8 }}
          >
            Enviar
          </button>
        </>
      )}

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 24 }}>
        <Link href="/dashboard">Volver al panel</Link>
      </p>
    </main>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
