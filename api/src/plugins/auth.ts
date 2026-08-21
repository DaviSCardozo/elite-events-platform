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
    // RBAC simples: recebe os papéis permitidos e devolve um preHandler.
    // Ex: { preHandler: [app.authorize(['ORGANIZER'])] }
    authorize: (
      allowedRoles: JwtPayload['role'][],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

/**
 * Registra JWT + cookies e adiciona dois decorators:
 * - `authenticate`: exige apenas estar logado (qualquer papel).
 * - `authorize([...papeis])`: exige estar logado E ter um dos papéis
 *   informados. Não usa CASL de propósito — com 3 papéis fixos e sem
 *   regras condicionais, uma checagem direta de array é suficiente e
 *   mais fácil de auditar do que uma lib de permissões dinâmicas.
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

    app.decorate('authorize', (allowedRoles: JwtPayload['role'][]) => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify()
        } catch {
          return reply
            .status(401)
            .send({ statusCode: 401, error: 'Unauthorized', message: 'Não autenticado' })
        }

        if (!allowedRoles.includes(request.user.role)) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Você não tem permissão para acessar este recurso',
          })
        }
      }
    })
  },
  { name: 'auth', dependencies: ['prisma'] },
)
