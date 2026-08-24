import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckoutSection } from '@/components/checkout-section'

interface Event {
  id: string
  title: string
  description: string | null
  posterUrl: string | null
  date: string
  location: string
  price: string
  capacidadeTotal: number
  disponiveis: number
}

async function getEvent(id: string): Promise<Event | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3334/api/v1'
  const res = await fetch(`${API_URL}/events/${id}`, { cache: 'no-store' })

  if (!res.ok) return null

  const json = await res.json()
  return json.event
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

export default async function EventoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-4">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Voltar para eventos
        </Link>
      </header>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2">
        <div>
          {event.posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.posterUrl}
              alt={event.title}
              className="w-full rounded-lg object-cover"
            />
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          {event.description && (
            <p className="text-muted-foreground">{event.description}</p>
          )}

          <div className="space-y-1 text-sm">
            <p>
              <strong>Data:</strong> {formatDate(event.date)}
            </p>
            <p>
              <strong>Local:</strong> {event.location}
            </p>
            <p>
              <strong>Preço:</strong>{' '}
              {Number(event.price).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <CheckoutSection
              eventId={event.id}
              price={event.price}
              disponiveis={event.disponiveis}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
