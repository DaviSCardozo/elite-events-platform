import { buildApp } from './app.js'
import { env } from './config/env.js'

const app = await buildApp()

// Encerra conexões abertas (inclui o pool do Postgres via hook onClose).
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, 'desligando...')
    try {
      await app.close()
      process.exit(0)
    } catch (err) {
      app.log.error({ err }, 'falha no shutdown')
      process.exit(1)
    }
  })
}

try {
  await app.listen({ port: env.PORT, host: env.HOST })
} catch (err) {
  app.log.error({ err }, 'falha ao subir o servidor')
  process.exit(1)
}
