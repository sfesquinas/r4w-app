// pages/answer.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type Question = {
  id: string
  text: string
  options: string[]
  correct_index: number
  category: string | null
}

type AnswerRow = {
  id: string
  created_at: string
}

export default function AnswerPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [choice, setChoice] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [alreadyToday, setAlreadyToday] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/'
        return
      }

      const userId = session.user.id

      // 1) Pregunta del día desde la función SQL r4w_get_question_of_day()
      const { data: qData, error: qError } = await supabase.rpc(
        'r4w_get_question_of_day'
      )

      if (qError) {
        console.error('Error cargando pregunta del día', qError)
        setMsg('Error cargando la pregunta del día')
        setLoading(false)
        return
      }

      if (!qData || !qData.length) {
        setMsg('No hay pregunta configurada para hoy.')
        setLoading(false)
        return
      }

      const q = qData[0] as any

      setQuestion({
        id: q.id,
        text: q.text,
        options: q.options || [],
        correct_index: q.correct_index,
        category: q.category,
      })

      // 2) Comprobar si el usuario YA ha respondido hoy
      const { data: ansData, error: ansError } = await supabase
        .from('answers')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (ansError) {
        console.error('Error comprobando respuestas', ansError)
      } else if (ansData && ansData.length > 0) {
        const last = ansData[0] as AnswerRow
        const todayStr = new Date().toISOString().slice(0, 10)
        const lastDayStr = last.created_at.slice(0, 10)

        if (todayStr === lastDayStr) {
          setAlreadyToday(true)
          setMsg('Ya has respondido la pregunta de hoy. Mañana tendrás una nueva.')
        }
      }

      setLoading(false)
    })()
  }, [])

  async function submit() {
    if (!question) return
    if (choice === null) {
      setMsg('Selecciona una opción antes de enviar.')
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/'
      return
    }

    if (alreadyToday) {
      setMsg('Ya has respondido la pregunta de hoy. Mañana tendrás otra nueva.')
      return
    }

    const correct = choice === question.correct_index

    const { error } = await supabase.from('answers').insert({
      user_id: session.user.id,
      question_id: question.id,
      chosen_index: choice,
      is_correct: correct,
    })

    if (error) {
      console.error('Error guardando respuesta', error)

      // Si es por la restricción de "ya has respondido hoy" en la BD:
      if (
        error.message.includes('answers_unique_user_answer_date') ||
        error.message.includes('answers_unique_user_day')
      ) {
        setAlreadyToday(true)
        setMsg('Ya has respondido la pregunta de hoy. Mañana tendrás otra nueva.')
        return
      }

      setMsg('Error guardando la respuesta: ' + error.message)
      return
    }

    setAlreadyToday(true)
    setMsg(correct ? '✅ ¡Respuesta correcta!' : '❌ No es correcta, pero suma experiencia 😉')
  }

  return (
    <main
      style={{
        maxWidth: 800,
        margin: '40px auto',
        fontFamily: 'system-ui',
        padding: '0 16px',
      }}
    >
      <h1>Responder pregunta</h1>

      {loading && <p>Cargando…</p>}

      {!loading && question && (
        <>
          <h3 style={{ marginTop: 16 }}>{question.text}</h3>

          {question.category && (
            <p style={{ fontSize: 12, color: '#666' }}>
              Categoría: {question.category}
            </p>
          )}

          <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
            {question.options.map((opt, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <label
                  style={{
                    display: 'block',
                    border: '1px solid #ccc',
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: alreadyToday ? 'not-allowed' : 'pointer',
                    opacity: alreadyToday ? 0.6 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name="opt"
                    disabled={alreadyToday}
                    checked={choice === idx}
                    onChange={() => setChoice(idx)}
                    style={{ marginRight: 8 }}
                  />
                  {opt}
                </label>
              </li>
            ))}
          </ul>

          <button
            onClick={submit}
            disabled={alreadyToday}
            style={{
              marginTop: 12,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #000',
              cursor: alreadyToday ? 'not-allowed' : 'pointer',
            }}
          >
            Enviar respuesta
          </button>
        </>
      )}

      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}

      <p style={{ marginTop: 24 }}>
        <Link href="/dashboard">Volver al panel</Link>
      </p>
    </main>
  )
}
