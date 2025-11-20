import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type Question = {
  id: string
  prompt: string
  options: string[]
  correct_index: number
  category: string | null
}

export default function AnswerPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [choice, setChoice] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (typeof window !== 'undefined') window.location.href = '/'
        return
      }

      // Pregunta del día mediante la función SQL
      const { data, error } = await supabase.rpc('r4w_today_question')

      if (error) {
        console.error(error)
        setMsg('Error cargando pregunta')
        return
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setMsg('No hay pregunta hoy')
        return
      }

      const row = Array.isArray(data) ? data[0] : data

      setQuestion({
        id: row.id,
        prompt: row.prompt,
        options: row.options,
        correct_index: row.correct_index,
        category: row.category
      })
    })()
  }, [])

  async function submit() {
    if (!question || choice === null) {
      setMsg('Selecciona una opción')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const correct = choice === question.correct_index
    const todayStr = new Date().toISOString().slice(0, 10)

    const { error } = await supabase.from('answers').insert({
      user_id: session.user.id,
      question_id: question.id,
      selected_index: choice,
      chosen_index: choice,
      is_correct: correct,
      answer_date: todayStr
    })

    if (error) {
      console.error(error)

      if (error.code === '23505') {
        setMsg('Ya has respondido hoy. Vuelve mañana ✨')
      } else {
        setMsg('Error guardando: ' + error.message)
      }
      return
    }

    setMsg(correct ? '✅ ¡Correcta!' : '❌ Incorrecta')
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1>Responder</h1>

      {!question && !msg && <p>Cargando…</p>}

      {question && (
        <>
          <h3>{question.prompt}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {question.options.map((opt, idx) => (
              <li key={idx} style={{ margin: '8px 0' }}>
                <label style={{ display: 'block', cursor: 'pointer', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}>
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
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8
            }}
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
