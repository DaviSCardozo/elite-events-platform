import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { z } from 'zod'

const createUserBodySchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email(),
  password: z.string().min(6, 'Senha precisa ter no mínimo 6 caracteres'),
})

const userRoutes: FastifyPluginAsync = async (app) => {
  // Cadastro público. Sempre cria como CUSTOMER — ORGANIZER e DOORMAN
  // não são auto-cadastráveis por segurança (só existem via seed/admin).
  app.post('/users', async (request, reply) => {
    const parsed = createUserBodySchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      })
    }

    const { name, email, password } = parsed.data

    const emailJaExiste = await app.prisma.user.findUnique({ where: { email } })

    if (emailJaExiste) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Este e-mail já está cadastrado',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await app.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.CUSTOMER,
      },
    })

    return reply.status(201).send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  })
}

export default userRoutes
