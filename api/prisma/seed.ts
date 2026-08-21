import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senhaPadrao = await bcrypt.hash('123456', 10)

  // --- Organizador ---
  const organizador = await prisma.user.upsert({
    where: { email: 'organizador@eventos.com' },
    update: {},
    create: {
      name: 'Ana Organizadora',
      email: 'organizador@eventos.com',
      passwordHash: senhaPadrao,
      role: Role.ORGANIZER,
    },
  })

  // --- Clientes ---
  const cliente1 = await prisma.user.upsert({
    where: { email: 'cliente1@eventos.com' },
    update: {},
    create: {
      name: 'Carlos Cliente',
      email: 'cliente1@eventos.com',
      passwordHash: senhaPadrao,
      role: Role.CUSTOMER,
    },
  })

  const cliente2 = await prisma.user.upsert({
    where: { email: 'cliente2@eventos.com' },
    update: {},
    create: {
      name: 'Bia Cliente',
      email: 'cliente2@eventos.com',
      passwordHash: senhaPadrao,
      role: Role.CUSTOMER,
    },
  })

  // --- Portaria ---
  const portaria = await prisma.user.upsert({
    where: { email: 'portaria@eventos.com' },
    update: {},
    create: {
      name: 'Pedro Portaria',
      email: 'portaria@eventos.com',
      passwordHash: senhaPadrao,
      role: Role.DOORMAN,
    },
  })

  // --- Evento (dados de exemplo, referência de filme real da TMDb) ---
  // tmdbId e posterUrl aqui são fixos como placeholder — quando o service de
  // integração com a TMDb estiver pronto, isso pode ser substituído por uma
  // busca real na hora de criar o evento pelo organizador.
  const evento = await prisma.event.create({
    data: {
      title: 'Vingadores: Ultimato — Sessão Especial',
      description: 'Exibição especial com conteúdo extra pós-créditos.',
      tmdbId: 299534,
      posterUrl: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
      date: new Date('2026-09-15T20:00:00Z'),
      location: 'Cinemark Shopping Center — Sala 3',
      price: 35.0,
      capacidadeTotal: 50,
      organizerId: organizador.id,
    },
  })

  console.log('Seed concluído:')
  console.log({ organizador: organizador.email, cliente1: cliente1.email, cliente2: cliente2.email, portaria: portaria.email })
  console.log({ evento: evento.title, id: evento.id })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
