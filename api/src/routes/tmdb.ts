import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { searchMovies } from '../services/tmdb.js'

const querySchema = z.object({ query: z.string().min(1) })

// Só o organizador precisa buscar filmes (é ele quem cria eventos a partir
// do catálogo). Rota protegida, não pública.
const tmdbRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/tmdb/search',
    { preHandler: [app.authorize(['ORGANIZER'])] },
    async (request, reply) => {
      const parsed = querySchema.safeParse(request.query)

      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Parâmetro "query" é obrigatório',
        })
      }

      try {
        const movies = await searchMovies(parsed.data.query)
        return { data: movies }
      } catch {
        return reply.status(502).send({
          statusCode: 502,
          error: 'Bad Gateway',
          message: 'Não foi possível consultar a TMDb no momento',
        })
      }
    },
  )
}

export default tmdbRoutes
