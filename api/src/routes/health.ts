import type { FastifyPluginAsync } from 'fastify'

const healthRoutes: FastifyPluginAsync = async (app) => {
  // Liveness: o processo está de pé.
  app.get('/health', async () => ({
    status: 'ok',
    uptime: Math.round(process.uptime()),
  }))

  // Readiness: dependências externas respondem.
  app.get('/health/ready', async (_request, reply) => {
    try {
      await app.db.query('select 1')
      return { status: 'ready', database: 'up' }
    } catch (err) {
      app.log.error({ err }, 'readiness falhou')
      return reply.status(503).send({ status: 'unavailable', database: 'down' })
    }
  })
}

export default healthRoutes
