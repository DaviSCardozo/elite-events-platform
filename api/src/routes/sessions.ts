import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/sessions', async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'E-mail ou senha em formato inválido',
      })
    }

    const { email, password } = parsed.data

    const user = await app.prisma.user.findUnique({ where: { email } })

    // Mensagem genérica de propósito: não revela se foi o e-mail ou a senha
    // que errou, evitando dar pista pra quem tenta adivinhar credenciais.
    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'E-mail ou senha inválidos',
      })
    }

    const senhaValida = await bcrypt.compare(password, user.passwordHash)

    if (!senhaValida) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'E-mail ou senha inválidos',
      })
    }

    const token = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '7d' })

    reply.setCookie('session_token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 dias, em segundos
    })

    return reply.status(200).send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  })

  // Rota auxiliar para o front saber quem está logado a partir do cookie.
  app.get('/sessions/me', { preHandler: [app.authenticate] }, async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, name: true, email: true, role: true },
    })
    return { user }
  })

  // Logout: apaga o cookie.
  app.delete('/sessions', async (_request, reply) => {
    reply.clearCookie('session_token', { path: '/' })
    return reply.status(204).send()
  })
}

export default sessionRoutes
