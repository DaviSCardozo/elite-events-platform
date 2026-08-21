import fp from 'fastify-plugin'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../config/env.js'

// Formato dos dados guardados dentro do token JWT.
export interface JwtPayload {
  sub: string // id do usuário
  role: 'ORGANIZER' | 'CUSTOMER' | 'DOORMAN'
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

/**
 * Registra JWT + cookies e adiciona um decorator `authenticate` que as
 * rotas protegidas podem usar como `preHandler`. O token fica num cookie
 * httpOnly (não acessível via JS no browser) — mais seguro que localStorage.
 */
export default fp(
  async (app) => {
    await app.register(cookie)

    await app.register(jwt, {
      secret: env.JWT_SECRET,
      cookie: {
        cookieName: 'session_token',
        signed: false,
      },
    })

    app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch {
        reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Não autenticado' })
      }
    })
  },
  { name: 'auth', dependencies: ['prisma'] },
)
