import type { FastifyPluginAsync } from 'fastify'

/**
 * Rota de exemplo para validar o roteamento ponta a ponta.
 * Substituir por consultas reais quando o schema do banco existir.
 */
const eventRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/events',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array', items: { type: 'object' } },
              total: { type: 'integer' },
            },
          },
        },
      },
    },
    async () => ({ data: [], total: 0 }),
  )
}

export default eventRoutes
