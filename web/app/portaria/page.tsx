'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'

interface SessionUser {
  role: 'ORGANIZER' | 'CUSTOMER' | 'DOORMAN'
}

interface Event {
  id: string
  title: string
}

type ValidationResult = 'VALIDO' | 'JA_UTILIZADO' | 'EVENTO_ERRADO' | 'INVALIDO'

const RESULT_CONFIG: Record<
  ValidationResult,
  { label: string; className: string }
> = {
  VALIDO: { label: '✓ Ingresso Válido', className: 'bg-green-100 border-green-400 text-green-800' },
  JA_UTILIZADO: {
    label: '⚠ Ingresso Já Utilizado',
    className: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  },
  INVALIDO: { label: '✕ Ingresso Inválido', className: 'bg-red-100 border-red-400 text-red-800' },
  EVENTO_ERRADO: {
    label: '⚠ Evento Errado',
    className: 'bg-orange-100 border-orange-400 text-orange-800',
  },
}

export default function PortariaPage() {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ result: ValidationResult; message: string } | null>(
    null,
  )

  useEffect(() => {
    apiFetch('/sessions/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user ?? null)
        return apiFetch('/events')
          .then((res) => res.json())
          .then((d) => setEvents(d.data ?? []))
      })
      .finally(() => setChecking(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFeedback(null)
    setLoading(true)

    try {
      const res = await apiFetch('/tickets/validate', {
        method: 'POST',
        body: JSON.stringify({ code, eventId: selectedEventId }),
      })

      const data = await res.json()
      setFeedback({ result: data.result, message: data.message })
      setCode('')
    } catch {
      setFeedback({ result: 'INVALIDO', message: 'Erro de conexão com o servidor' })
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  if (!user || user.role !== 'DOORMAN') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Ir para login</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Validação de Ingressos — Portaria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event">Evento desta portaria</Label>
            <select
              id="event"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              required
            >
              <option value="">Selecione o evento</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <Label htmlFor="code">Código do ingresso (digitação manual)</Label>
            <Input
              id="code"
              required
              disabled={!selectedEventId}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Cole ou digite o código do ingresso"
            />
            <Button type="submit" className="w-full" disabled={loading || !selectedEventId}>
              {loading ? 'Validando...' : 'Validar ingresso'}
            </Button>
          </form>

          {feedback && (
            <div className={`rounded-md border p-4 text-center font-medium ${RESULT_CONFIG[feedback.result].className}`}>
              <p>{RESULT_CONFIG[feedback.result].label}</p>
              <p className="text-sm font-normal">{feedback.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
