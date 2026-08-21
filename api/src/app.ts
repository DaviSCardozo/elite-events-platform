import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import sensible from '@fastify/sensible'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import { corsOrigin, env, isProduction } from './config/env.js'
import db from './plugins/db.js'
import eventRoutes from './routes/events.js'
import healthRoutes from './routes/health.js'
import prisma from './plugins/prisma.js'
import auth from './plugins/auth.js'
import sessionRoutes from './routes/sessions.js'
import userRoutes from './routes/users.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      // pino-pretty só faz sentido em dev; em produção, JSON puro.
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
          },
    },
    trustProxy: isProduction,
  })

  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cors, { origin: corsOrigin, credentials: true })
  await app.register(sensible)

  await app.register(db)
  await app.register(prisma)
  await app.register(auth)

  await app.register(healthRoutes)
  await app.register(eventRoutes, { prefix: '/api/v1' })
  await app.register(sessionRoutes, { prefix: '/api/v1' })
  await app.register(userRoutes, { prefix: '/api/v1' })

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Rota ${request.method} ${request.url} não existe`,
    })
  })

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'erro não tratado')
    } else {
      request.log.warn({ err: error }, 'erro de requisição')
    }

    reply.status(statusCode).send({
      statusCode,
      error: error.name,
      // Nunca vazar detalhes internos de 5xx em produção.
      message:
        statusCode >= 500 && isProduction ? 'Erro interno do servidor' : error.message,
    })
  })

  return app
}
