'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/api'

interface Ticket {
  id: string
  code: string
  status: 'VALID' | 'USED'
  qrToken: string
  event: {
    title: string
    date: string
    location: string
  }
}

interface SessionUser {
  role: 'ORGANIZER' | 'CUSTOMER' | 'DOORMAN'
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
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/sessions/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user ?? null)
        if (data?.user?.role === 'CUSTOMER') {
          return apiFetch('/tickets/me')
            .then((res) => res.json())
            .then((d) => setTickets(d.tickets ?? []))
        }
      })
      .finally(() => setChecking(false))
  }, [])

  function copyLink(ticket: Ticket) {
    const url = `${window.location.origin}/ticket/${ticket.qrToken}`
    navigator.clipboard.writeText(url)
    setCopiedId(ticket.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  if (!user || user.role !== 'CUSTOMER') {
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
    <main className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-4">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Voltar para eventos
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">Meus Ingressos</h1>

        {tickets.length === 0 ? (
          <p className="text-muted-foreground">Você ainda não tem ingressos.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="flex justify-center sm:justify-start">
                    <QRCodeSVG value={ticket.code} size={140} />
                  </div>

                  <div className="flex-1 space-y-1">
                    <h2 className="font-semibold">{ticket.event.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(ticket.event.date)}
                    </p>
                    <p className="text-sm text-muted-foreground">{ticket.event.location}</p>
                    <p className="text-sm">
                      Status:{' '}
                      <span
                        className={
                          ticket.status === 'VALID'
                            ? 'font-medium text-green-600'
                            : 'font-medium text-muted-foreground'
                        }
                      >
                        {ticket.status === 'VALID' ? 'Válido' : 'Já utilizado'}
                      </span>
                    </p>
                    <Button variant="outline" size="sm" onClick={() => copyLink(ticket)}>
                      {copiedId === ticket.id ? 'Link copiado!' : 'Copiar link para compartilhar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
