import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const createEventBodySchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  tmdbId: z.number().int().optional(),
  posterUrl: z.string().url().optional(),
  date: z.coerce.date(),
  location: z.string().min(2),
  price: z.number().positive(),
  capacidadeTotal: z.number().int().positive(),
})

const eventRoutes: FastifyPluginAsync = async (app) => {
  // Pública: qualquer um pode ver os eventos publicados.
  app.get('/events', async () => {
    const events = await app.prisma.event.findMany({ orderBy: { date: 'asc' } })
    return { data: events, total: events.length }
  })

  // Pública: detalhe de um evento, com disponibilidade calculada.
  app.get('/events/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const event = await app.prisma.event.findUnique({ where: { id } })

    if (!event) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Evento não encontrado',
      })
    }

    const ticketsVendidos = await app.prisma.ticket.count({ where: { eventId: id } })
    const disponiveis = event.capacidadeTotal - ticketsVendidos

    return { event: { ...event, disponiveis } }
  })

  // Protegida: só ORGANIZER pode criar evento.
  app.post(
    '/events',
    { preHandler: [app.authorize(['ORGANIZER'])] },
    async (request, reply) => {
      const parsed = createEventBodySchema.safeParse(request.body)

      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
        })
      }

      const event = await app.prisma.event.create({
        data: {
          ...parsed.data,
          organizerId: request.user.sub,
        },
      })

      return reply.status(201).send({ event })
    },
  )
}

export default eventRoutes
