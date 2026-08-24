'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'

interface SessionUser {
  id: string
  role: 'ORGANIZER' | 'CUSTOMER' | 'DOORMAN'
}

interface Ticket {
  id: string
  code: string
}

interface CheckoutSectionProps {
  eventId: string
  price: string
  disponiveis: number
}

export function CheckoutSection({ eventId, price, disponiveis }: CheckoutSectionProps) {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)

  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    status: 'APPROVED' | 'REJECTED'
    tickets: Ticket[]
  } | null>(null)

  useEffect(() => {
    apiFetch('/sessions/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .finally(() => setChecking(false))
  }, [])

  async function handlePurchase(decision: 'APPROVE' | 'REJECT') {
    setError(null)
    setLoading(true)

    try {
      const res = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({ eventId, quantity, decision }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.message ?? 'Não foi possível concluir a compra')
        return
      }

      setResult({ status: data.order.status, tickets: data.tickets })
    } catch {
      setError('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (!user) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Entre para comprar ingressos.</p>
        <Button asChild>
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    )
  }

  if (user.role !== 'CUSTOMER') {
    return (
      <p className="text-sm text-muted-foreground">
        Apenas clientes podem comprar ingressos.
      </p>
    )
  }

  if (result) {
    if (result.status === 'REJECTED') {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">Pagamento recusado</p>
          <p className="text-sm text-red-600">
            A simulação de pagamento foi recusada. Nenhum ingresso foi gerado.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => setResult(null)}>
            Tentar novamente
          </Button>
        </div>
      )
    }

    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4">
        <p className="font-medium text-green-700">Compra aprovada!</p>
        <p className="text-sm text-green-700">
          {result.tickets.length} ingresso(s) gerado(s). Acesse &quot;Meus Ingressos&quot; para ver
          o QR code de cada um.
        </p>
        <ul className="mt-2 space-y-1 text-xs text-green-800">
          {result.tickets.map((t) => (
            <li key={t.id}>Código: {t.code}</li>
          ))}
        </ul>
      </div>
    )
  }

  if (disponiveis <= 0) {
    return <p className="text-sm font-medium text-red-600">Ingressos esgotados.</p>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={disponiveis}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">{disponiveis} disponível(is)</p>
      </div>

      <p className="text-lg font-semibold">
        Total:{' '}
        {(Number(price) * quantity).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={loading}
          onClick={() => handlePurchase('APPROVE')}
        >
          {loading ? 'Processando...' : 'Simular Aprovação'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={loading}
          onClick={() => handlePurchase('REJECT')}
        >
          Simular Recusa
        </Button>
      </div>
    </div>
  )
}
