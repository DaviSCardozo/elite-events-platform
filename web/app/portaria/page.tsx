'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
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

const RESULT_CONFIG: Record<ValidationResult, { label: string; className: string }> = {
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

const SCANNER_ELEMENT_ID = 'qr-reader'

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
  const [scannerActive, setScannerActive] = useState(false)

  // Guarda a instância do scanner entre renders para poder limpar (parar a
  // câmera) sem depender de closures desatualizadas do useEffect.
  const scannerRef = useRef<import('html5-qrcode').Html5QrcodeScanner | null>(null)

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

  // Liga/desliga a câmera. html5-qrcode acessa navigator.mediaDevices, que
  // só existe no navegador — por isso o import é dinâmico, dentro do
  // useEffect, nunca no topo do arquivo (evitaria erro de SSR no Next.js).
  useEffect(() => {
    if (!scannerActive) {
      scannerRef.current?.clear().catch(() => {})
      scannerRef.current = null
      return
    }

    let cancelled = false

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (cancelled) return

      const scanner = new Html5QrcodeScanner(
        SCANNER_ELEMENT_ID,
        { fps: 10, qrbox: 250 },
        false,
      )

      scanner.render(
        (decodedText) => {
          setCode(decodedText)
          setScannerActive(false)
          void validateCode(decodedText)
        },
        () => {
          // erro de leitura por frame (QR fora do quadro) — ignorado
          // silenciosamente, é esperado acontecer o tempo todo até focar.
        },
      )

      scannerRef.current = scanner
    })

    return () => {
      cancelled = true
      scannerRef.current?.clear().catch(() => {})
      scannerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive])

  async function validateCode(codeToValidate: string) {
    setFeedback(null)
    setLoading(true)

    try {
      const res = await apiFetch('/tickets/validate', {
        method: 'POST',
        body: JSON.stringify({ code: codeToValidate, eventId: selectedEventId }),
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

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    await validateCode(code)
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

          <div className="space-y-2">
            <Button
              type="button"
              variant={scannerActive ? 'destructive' : 'default'}
              className="w-full"
              disabled={!selectedEventId}
              onClick={() => setScannerActive((v) => !v)}
            >
              {scannerActive ? 'Parar câmera' : '📷 Ler QR pela câmera'}
            </Button>
            {scannerActive && <div id={SCANNER_ELEMENT_ID} className="w-full" />}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou digite manualmente
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-2">
            <Label htmlFor="code">Código do ingresso</Label>
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
            <div
              className={`rounded-md border p-4 text-center font-medium ${RESULT_CONFIG[feedback.result].className}`}
            >
              <p>{RESULT_CONFIG[feedback.result].label}</p>
              <p className="text-sm font-normal">{feedback.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
