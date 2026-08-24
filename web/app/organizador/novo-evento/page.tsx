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

export default function NovoEventoPage() {
  const router = useRouter()

  // Estado de checagem de sessão — três fases: carregando, autorizado, negado.
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [price, setPrice] = useState('')
  const [capacidadeTotal, setCapacidadeTotal] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Ao carregar a página, confirma se existe sessão válida e se é ORGANIZER.
  // Rota protegida no front espelha a proteção que já existe no back
  // (app.authorize(['ORGANIZER'])) — aqui é só para não mostrar o formulário
  // à toa; a garantia de verdade continua sendo o backend.
  useEffect(() => {
    apiFetch('/sessions/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .finally(() => setChecking(false))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          location,
          date: new Date(date).toISOString(),
          price: Number(price),
          capacidadeTotal: Number(capacidadeTotal),
          posterUrl: posterUrl || undefined,
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
      setError('Erro de conexão com o servidor. A API está rodando?')
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
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Novo evento</CardTitle>
          <CardDescription>Preencha os dados do evento que deseja publicar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
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

            <div className="space-y-2">
              <Label htmlFor="posterUrl">URL do pôster (opcional)</Label>
              <Input
                id="posterUrl"
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Publicando...' : 'Publicar evento'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
