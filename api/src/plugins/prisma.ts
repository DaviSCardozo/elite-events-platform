import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

/**
 * Prisma Client compartilhado pela aplicação. Diferente do plugin `db`
 * (que usa `pg` cru só para o healthcheck), este é o cliente usado nas
 * regras de negócio: auth, eventos, pedidos e ingressos.
 */
export default fp(
  async (app) => {
    const prisma = new PrismaClient()

    app.decorate('prisma', prisma)

    app.addHook('onClose', async () => {
      await prisma.$disconnect()
    })
  },
  { name: 'prisma' },
)
