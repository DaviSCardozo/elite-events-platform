'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/api'

interface SessionUser {
  id: string
  role: 'ORGANIZER' | 'CUSTOMER' | 'DOORMAN'
}

interface Ticket {
  id: string
  code: string
  status: 'VALID' | 'USED'
  qrToken: string
  event: {
    id: string
    title: string
    date: string
    location: string
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MeusIngressosPage() {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/sessions/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') {
      setLoading(false)
      return
    }

    apiFetch('/tickets/me')
      .then((res) => (res.ok ? res.json() : { tickets: [] }))
      .then((data) => setTickets(data.tickets ?? []))
      .finally(() => setLoading(false))
  }, [user])

  function handleCopyLink(ticket: Ticket) {
    const url = `${window.location.origin}/ticket/${ticket.qrToken}`
    navigator.clipboard.writeText(url)
    setCopiedId(ticket.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (checking || loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-4">
        <p className="text-sm text-muted-foreground">Entre para ver seus ingressos.</p>
        <Button asChild>
          <Link href="/login">Entrar</Link>
        </Button>
      </main>
    )
  }

  if (user.role !== 'CUSTOMER') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-muted-foreground">Apenas clientes possuem ingressos.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Meus ingressos</h1>

      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você ainda não tem ingressos.{' '}
          <Link href="/" className="underline">
            Ver eventos
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <CardTitle className="text-base">{ticket.event.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {formatDate(ticket.event.date)} — {ticket.event.location}
                </p>

                <div className="flex justify-center rounded-md border bg-white p-4">
                  <QRCodeSVG value={ticket.qrToken} size={160} />
                </div>

                <p
                  className={
                    ticket.status === 'USED'
                      ? 'text-xs font-medium text-amber-600'
                      : 'text-xs font-medium text-green-600'
                  }
                >
                  {ticket.status === 'USED' ? 'Já utilizado' : 'Válido'}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleCopyLink(ticket)}
                >
                  {copiedId === ticket.id ? 'Link copiado!' : 'Copiar link para compartilhar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}