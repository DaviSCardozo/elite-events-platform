interface TicketPublic {
  id: string
  code: string
  status: 'VALID' | 'USED'
  event: {
    title: string
    date: string
    location: string
    posterUrl: string | null
  }
  owner: {
    name: string
  }
}

async function getTicket(token: string): Promise<TicketPublic | null> {
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

export default async function TicketPublicPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const ticket = await getTicket(token)

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">
          Link de ingresso inválido, expirado, ou o ingresso não existe.
        </p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        {ticket.event.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ticket.event.posterUrl}
            alt={ticket.event.title}
            className="mb-4 w-full rounded-md object-cover"
          />
        )}
        <h1 className="text-xl font-bold">{ticket.event.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{formatDate(ticket.event.date)}</p>
        <p className="text-sm text-muted-foreground">{ticket.event.location}</p>
        <p className="mt-2 text-sm">
          Ingresso de: <strong>{ticket.owner.name}</strong>
        </p>
        <p className="mt-4 text-sm">
          Status:{' '}
          <span
            className={
              ticket.status === 'VALID' ? 'font-medium text-green-600' : 'font-medium text-muted-foreground'
            }
          >
            {ticket.status === 'VALID' ? 'Válido' : 'Já utilizado'}
          </span>
        </p>
      </div>
    </main>
  )
}
