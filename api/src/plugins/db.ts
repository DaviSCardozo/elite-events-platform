import fp from 'fastify-plugin'
import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from '../config/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: {
      pool: Pool
      query<T extends QueryResultRow = QueryResultRow>(
        text: string,
        params?: unknown[],
      ): Promise<QueryResult<T>>
    }
  }
}

/**
 * Pool do Postgres compartilhado pela aplicação. Não conecta no boot de
 * propósito: a API sobe mesmo com o banco fora do ar, e `/health/ready`
 * é quem reporta o estado real da conexão.
 */
export default fp(
  async (app) => {
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })

    pool.on('error', (err) => {
      app.log.error({ err }, 'erro em cliente idle do pool')
    })

    app.decorate('db', {
      pool,
      query: (text, params) => pool.query(text, params as never[]),
    })

    app.addHook('onClose', async () => {
      await pool.end()
    })
  },
  { name: 'db' },
)
