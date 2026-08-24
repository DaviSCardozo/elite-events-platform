import { notFound } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

interface PublicTicket {
  id: string
  code: string
  status: 'VALID' | 'USED'
  event: {
    title: string
    date: string
    location: string
  }
  owner: {
    name: string
  }
}

async function getPublicTicket(token: string): Promise<PublicTicket | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3334/api/v1'
  const res = await fetch(`${API_URL}/tickets/public/${token}`, { cache: 'no-store' })

  if (!res.ok) return null

  const json = await res.json()
  return json.ticket
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

export default async function PublicTicketPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const ticket = await getPublicTicket(token)

  if (!ticket) {
    notFound()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">{ticket.event.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(ticket.event.date)} — {ticket.event.location}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Portador: {ticket.owner.name}</p>

        <div className="my-4 flex justify-center rounded-md border bg-white p-4">
          <QRCodeSVG value={token} size={180} />
        </div>

        <p
          className={
            ticket.status === 'USED'
              ? 'text-sm font-medium text-amber-600'
              : 'text-sm font-medium text-green-600'
          }
        >
          {ticket.status === 'USED' ? 'Ingresso já utilizado' : 'Ingresso válido'}
        </p>
      </div>
    </main>
  )
}