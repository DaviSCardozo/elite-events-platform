import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const validateTicketBodySchema = z.object({
  code: z.string().min(1),
  eventId: z.string().uuid(),
})

const ticketRoutes: FastifyPluginAsync = async (app) => {
  // --- "Meus Ingressos": lista os ingressos do cliente logado ---
  app.get(
    '/tickets/me',
    { preHandler: [app.authorize(['CUSTOMER'])] },
    async (request) => {
      const tickets = await app.prisma.ticket.findMany({
        where: { ownerId: request.user.sub },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
      })

      // Cada ingresso recebe seu próprio token assinado — é ESSE token
      // (não o `code` puro) que vira o QR. Sem a assinatura JWT, qualquer
      // um poderia digitar um código aleatório e forjar um ingresso válido.
      const ticketsComToken = tickets.map((ticket) => {
        const ticketPayload = {
          ticketCode: ticket.code,
          type: 'ticket',
        }

        return {
          ...ticket,
          // Cast intencional: este token não é de autenticação de usuário
          // (não tem `sub`/`role`, que o projeto exige no JwtPayload global
          // por causa do token de login). É um payload próprio, só para
          // identificar o ingresso de forma assinada — daí o cast explícito.
          qrToken: app.jwt.sign(ticketPayload as any, { expiresIn: '365d' }),
        }
      })

      return { tickets: ticketsComToken }
    },
  )

  // --- Rota pública: qualquer um com o link pode ver o ingresso ---
  // (requisito do edital: "compartilhar um ingresso via um link gerado")
  app.get('/tickets/public/:token', async (request, reply) => {
    const { token } = request.params as { token: string }

    let payload: { ticketCode: string; type: string }
    try {
      payload = app.jwt.verify(token)
    } catch {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Link de ingresso inválido ou expirado',
      })
    }

    if (payload.type !== 'ticket') {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Token inválido' })
    }

    const ticket = await app.prisma.ticket.findUnique({
      where: { code: payload.ticketCode },
      include: { event: true, owner: { select: { name: true } } },
    })

    if (!ticket) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Ingresso não encontrado' })
    }

    return { ticket }
  })

  // --- Portaria: valida o ingresso na entrada (4 estados) ---
  app.post(
    '/tickets/validate',
    { preHandler: [app.authorize(['DOORMAN'])] },
    async (request, reply) => {
      const parsed = validateTicketBodySchema.safeParse(request.body)

      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Código e evento são obrigatórios',
        })
      }

      const { code, eventId } = parsed.data

      const ticket = await app.prisma.ticket.findUnique({ where: { code } })

      // Estado 1: código não existe no banco.
      if (!ticket) {
        return reply.status(200).send({ result: 'INVALIDO', message: 'Ingresso não encontrado' })
      }

      // Estado 2: ingresso é de outro evento (portaria errada / evento errado).
      if (ticket.eventId !== eventId) {
        return reply.status(200).send({ result: 'EVENTO_ERRADO', message: 'Este ingresso é de outro evento' })
      }

      // Estado 3: já foi usado antes.
      if (ticket.status === 'USED') {
        return reply.status(200).send({
          result: 'JA_UTILIZADO',
          message: 'Ingresso já validado anteriormente',
          validatedAt: ticket.validatedAt,
        })
      }

      // Estado 4: válido — marca como usado.
      const atualizado = await app.prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'USED', validatedAt: new Date() },
      })

      return reply.status(200).send({ result: 'VALIDO', message: 'Ingresso válido', ticket: atualizado })
    },
  )
}

export default ticketRoutes