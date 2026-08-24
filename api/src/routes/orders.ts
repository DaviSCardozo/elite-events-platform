import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const createOrderBodySchema = z.object({
  eventId: z.string().uuid(),
  quantity: z.number().int().positive(),
  // Simula a decisão do "provedor de pagamento" — o front manda essa opção
  // vindo dos botões "Simular Aprovação" / "Simular Recusa" do checkout.
  decision: z.enum(['APPROVE', 'REJECT']),
})

const orderRoutes: FastifyPluginAsync = async (app) => {
  // Só CUSTOMER pode comprar ingresso.
  app.post(
    '/orders',
    { preHandler: [app.authorize(['CUSTOMER'])] },
    async (request, reply) => {
      const parsed = createOrderBodySchema.safeParse(request.body)

      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
        })
      }

      const { eventId, quantity, decision } = parsed.data
      const customerId = request.user.sub

      try {
        const result = await app.prisma.$transaction(async (tx) => {
          // Trava a linha do evento até esta transação terminar. Qualquer
          // outra compra concorrente do MESMO evento precisa esperar aqui
          // — é isso que impede duas pessoas comprarem "o último ingresso"
          // ao mesmo tempo e a contagem ficar inconsistente.
          await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`

          const event = await tx.event.findUnique({ where: { id: eventId } })

          if (!event) {
            throw new OrderError(404, 'Evento não encontrado')
          }

          // Estoque é sempre DERIVADO contando tickets reais (decisão tomada
          // na modelagem do schema), nunca um contador solto.
          const ticketsVendidos = await tx.ticket.count({ where: { eventId } })
          const disponiveis = event.capacidadeTotal - ticketsVendidos

          if (decision === 'APPROVE' && quantity > disponiveis) {
            throw new OrderError(
              409,
              `Apenas ${disponiveis} ingresso(s) disponível(is) para este evento`,
            )
          }

          const totalPrice = Number(event.price) * quantity

          const order = await tx.order.create({
            data: {
              customerId,
              eventId,
              quantity,
              totalPrice,
              status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            },
          })

          // Só gera ingresso de verdade se o pagamento simulado foi aprovado.
          if (decision === 'APPROVE') {
            await tx.ticket.createMany({
              data: Array.from({ length: quantity }, () => ({
                eventId,
                orderId: order.id,
                ownerId: customerId,
              })),
            })
          }

          const tickets = await tx.ticket.findMany({ where: { orderId: order.id } })

          return { order, tickets }
        })

        return reply.status(201).send(result)
      } catch (err) {
        if (err instanceof OrderError) {
          return reply
            .status(err.statusCode)
            .send({ statusCode: err.statusCode, error: 'Order Error', message: err.message })
        }
        throw err
      }
    },
  )
}

class OrderError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export default orderRoutes
