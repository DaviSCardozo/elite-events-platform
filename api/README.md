# Elite Events API

API em Fastify 5 + TypeScript (ESM).

## Rodando

```bash
# na raiz do repo: sobe o Postgres
docker compose up -d

# aqui em api/
cp .env.example .env
npm install
npm run dev
```

## Scripts

| Script              | O que faz                                  |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | tsx watch, reinicia a cada alteração       |
| `npm run build`     | compila para `dist/`                        |
| `npm start`         | roda o build (`dist/index.js`)              |
| `npm run typecheck` | `tsc --noEmit`                              |

## Rotas

| Método | Rota              | Descrição                                     |
| ------ | ----------------- | --------------------------------------------- |
| GET    | `/health`         | liveness — só o processo                       |
| GET    | `/health/ready`   | readiness — faz `select 1` no Postgres (503 se cair) |
| GET    | `/api/v1/events`  | exemplo, retorna lista vazia                   |

## Estrutura

```
src/
  index.ts         entrypoint: listen + graceful shutdown (SIGINT/SIGTERM)
  app.ts           monta o Fastify: plugins, rotas, error handler
  config/env.ts    valida process.env com zod, falha rápido no boot
  plugins/db.ts    pool do Postgres em app.db (decorator + onClose)
  routes/          um plugin por arquivo
```

Para adicionar uma rota: crie o arquivo em `src/routes/`, exporte um
`FastifyPluginAsync` e registre em `src/app.ts`.

## Notas

- O pool do Postgres **não** conecta no boot: a API sobe mesmo com o banco fora
  do ar, e quem reporta o estado real é `/health/ready`.
- Em produção (`NODE_ENV=production`) o log sai como JSON puro e mensagens de
  erro 5xx são mascaradas na resposta.
- Porta default `3333`; sobrescreva com `PORT`.
