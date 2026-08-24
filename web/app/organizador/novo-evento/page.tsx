'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'

interface SessionUser {
  id: string
  name: string
  email: string
  role: 'ORGANIZER' | 'CUSTOMER' | 'DOORMAN'
}

interface TmdbMovie {
  tmdbId: number
  title: string
  overview: string
  posterUrl: string | null
  releaseDate: string | null
}

export default function NovoEventoPage() {
  const router = useRouter()

  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)

  // Busca no catálogo da TMDb
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<TmdbMovie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null)

  // Dados do evento
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [price, setPrice] = useState('')
  const [capacidadeTotal, setCapacidadeTotal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch('/sessions/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .finally(() => setChecking(false))
  }, [])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setError(null)

    try {
      const res = await apiFetch(`/tmdb/search?query=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data?.message ?? 'Não foi possível buscar filmes')
        return
      }

      setResults(data.data)
    } catch {
      setError('Erro de conexão com o servidor.')
    } finally {
      setSearching(false)
    }
  }

  function selectMovie(movie: TmdbMovie) {
    setSelectedMovie(movie)
    setResults([])
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!selectedMovie) {
      setError('Selecione um filme do catálogo TMDb antes de publicar.')
      return
    }

    setLoading(true)

    try {
      const res = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({
          title: selectedMovie.title,
          description: selectedMovie.overview || undefined,
          tmdbId: selectedMovie.tmdbId,
          posterUrl: selectedMovie.posterUrl || undefined,
          location,
          date: new Date(date).toISOString(),
          price: Number(price),
          capacidadeTotal: Number(capacidadeTotal),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.message ?? 'Não foi possível criar o evento')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Erro de conexão com o servidor.')
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

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>Você precisa entrar para acessar esta página.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (user.role !== 'ORGANIZER') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
            <CardDescription>
              Esta página é exclusiva para organizadores de eventos.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Novo evento</CardTitle>
          <CardDescription>
            Busque um filme no catálogo da TMDb para publicar como evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedMovie ? (
            <>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Buscar filme (ex: Vingadores)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit" disabled={searching}>
                  {searching ? 'Buscando...' : 'Buscar'}
                </Button>
              </form>

              {error && <p className="text-sm text-red-600">{error}</p>}

              {results.length > 0 && (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {results.map((movie) => (
                    <button
                      key={movie.tmdbId}
                      type="button"
                      onClick={() => selectMovie(movie)}
                      className="flex w-full items-center gap-3 rounded-md border p-2 text-left hover:bg-muted"
                    >
                      {movie.posterUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={movie.posterUrl} alt={movie.title} className="h-16 w-11 rounded object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{movie.title}</p>
                        <p className="text-xs text-muted-foreground">{movie.releaseDate}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 rounded-md border p-3">
                {selectedMovie.posterUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedMovie.posterUrl}
                    alt={selectedMovie.title}
                    className="h-24 w-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{selectedMovie.title}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedMovie(null)}
                    className="text-xs text-muted-foreground underline"
                  >
                    Trocar filme
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input id="location" required value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data e hora</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidadeTotal">Capacidade</Label>
                  <Input
                    id="capacidadeTotal"
                    type="number"
                    min="1"
                    required
                    value={capacidadeTotal}
                    onChange={(e) => setCapacidadeTotal(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Publicando...' : 'Publicar evento'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
