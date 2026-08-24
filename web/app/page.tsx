import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Event {
  id: string
  title: string
  description: string | null
  posterUrl: string | null
  date: string
  location: string
  price: string // Prisma Decimal chega como string no JSON
  capacidadeTotal: number
}

async function getEvents(): Promise<Event[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3334/api/v1'

  const res = await fetch(`${API_URL}/events`, { cache: 'no-store' })

  if (!res.ok) {
    return []
  }

  const json = await res.json()
  return json.data
}

function formatPrice(price: string) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

export default async function HomePage() {
  const events = await getEvents()

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold">Elite Events Platform</h1>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/cadastro">Criar conta</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold">Eventos em cartaz</h2>

        {events.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum evento publicado no momento. Volte em breve.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={`/evento/${event.id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  {event.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.posterUrl}
                      alt={event.title}
                      className="h-56 w-full object-cover"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>{formatDate(event.date)}</p>
                    <p>{event.location}</p>
                    <p className="text-base font-semibold text-foreground">
                      {formatPrice(event.price)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
