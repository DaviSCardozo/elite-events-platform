# Registro de Problemas & Decisões Técnicas

Anotações em tempo real de imprevistos, erros e decisões tomadas durante o
desenvolvimento. Vira insumo para a seção "o que não funcionou como esperado"
e "decisões técnicas" do README final.

---

## 1. Prisma 7 — `datasource.url` não suportado no schema

**Quando:** Dia 1 (20/08), ao rodar `prisma migrate dev` pela primeira vez.

**O que aconteceu:** o projeto instalou Prisma v7 por padrão (versão mais
recente na hora do `npm install`). A v7 mudou a forma de configurar a conexão
com o banco — não aceita mais `url = env("DATABASE_URL")` direto no
`schema.prisma`, exige um arquivo `prisma.config.ts` separado. Erro:
`P1012 — datasource property url is no longer supported`.

**Decisão:** fixar a versão do Prisma em `6.x` (`npm install prisma@6
@prisma/client@6`), por ser a versão estável, compatível com o material de
estudo usado, e para evitar gastar tempo do desafio debugando uma mudança de
configuração muito recente (issues abertas no próprio repositório oficial do
Prisma sobre bugs na v7).

---

## 2. Localização do `schema.prisma` inconsistente

**Quando:** Dia 1 (20/08), logo após o downgrade para Prisma 6.

**O que aconteceu:** o arquivo `schema.prisma` acabou solto direto em `api/`
(fora da pasta `prisma/`), enquanto uma pasta `api/prisma/` vazia também
existia (sobra de um `mkdir` anterior sem o arquivo dentro). O Prisma CLI
aceita schema fora da pasta `prisma/` em alguns casos, o que mascarou o
problema até o momento de rodar a migration de novo depois de apagar a pasta
vazia — aí o comando passou a procurar especificamente em
`prisma/schema.prisma` e não encontrou, retornando `file not found`.

**Decisão:** mover o `schema.prisma` para o caminho padrão
`api/prisma/schema.prisma`, seguindo a convenção oficial do Prisma, em vez de
manter a localização não convencional. Evita ambiguidade e futuras confusões
de caminho.

---

## 3. `tsx` não reconhecido pelo comando de seed no Windows

**Quando:** Dia 1 (20/08), ao configurar `npx prisma db seed`.

**O que aconteceu:** o `tsx` está instalado como devDependency e funciona
normalmente em `npm run dev`, mas quando o Prisma executa o comando de seed
internamente (`tsx prisma/seed.ts`), o Windows não reconhecia o binário
(`'tsx' não é reconhecido como um comando interno ou externo`). Também notei
que o `npx prisma db seed` estava resolvendo uma versão diferente da
instalada localmente (comportamento inconsistente do npx no Windows).

**Decisão:** ajustar o comando de seed no `package.json` para
`"seed": "npx tsx prisma/seed.ts"` (com `npx` explícito antes do `tsx`), e
rodar o Prisma diretamente pelo binário local (`./node_modules/.bin/prisma`)
em vez de depender do `npx prisma` resolver a versão correta sozinho.

---

## 4. Schema de resposta do Fastify zerando os campos do evento

**Quando:** Dia 2 (21/08), ao integrar a listagem de eventos no front-end.

**O que aconteceu:** a rota `GET /events` tinha um `schema.response` definido
como placeholder desde o scaffold inicial (`items: { type: 'object' }`, sem
listar os campos). O Fastify usa esse schema para serializar a resposta de
forma otimizada — como os campos não estavam descritos, ele devolvia objetos
vazios (`{}`) mesmo com os dados corretos vindo do Prisma. O front-end
mostrava "Data inválida" e "R$ NaN" porque os campos realmente não existiam
na resposta, não por erro de formatação no React.

**Decisão:** remover o `schema.response` da rota, já que ela deixou de ser
um placeholder e passou a retornar dados reais do banco. Fica registrado como
lição: ao usar validação de schema de resposta no Fastify, é preciso manter
os campos sincronizados com o que a rota realmente retorna, ou removê-la
quando não for mais necessária.

---

## 5. Limite de tamanho de parâmetro de URL bloqueando o token do QR

**Quando:** Dia 3 (23-24/08), ao testar o link público do ingresso.

**O que aconteceu:** o Fastify tem um limite padrão de ~100 caracteres para
parâmetros de rota (`maxParamLength`), por segurança. O token JWT usado no
link do QR (`/tickets/public/:token`) é bem mais longo que isso, então a
requisição falhava com `414 — exceeding the max param length` antes mesmo de
chegar na lógica da rota.

**Decisão:** aumentar `maxParamLength` para 1000 na configuração do Fastify
(`Fastify({ ..., maxParamLength: 1000 })`). Valor generoso o suficiente para
qualquer JWT gerado no projeto, sem abrir mão da proteção contra parâmetros
absurdamente longos.

---

## 6. Cookie de sessão rejeitado (401) após múltiplas edições do .env

**Quando:** revisão final local, ao testar o painel do organizador.

**O que aconteceu:** o login retornava 200 com um cookie `session_token`
aparentemente válido (JWT bem formado, payload correto com `role:
ORGANIZER`), mas a chamada seguinte `GET /sessions/me` retornava 401. O
cookie chegava corretamente na API (confirmado via DevTools → Network →
Request Headers), então o problema não era de CORS/cookie — era de
verificação de assinatura.

**Causa:** o `.env` da API foi editado várias vezes ao longo do
desenvolvimento (adição de `TMDB_API_KEY`, `JWT_SECRET`, correções de
indentação). Um token antigo, gerado num login anterior a uma dessas
edições, ficou assinado com um valor de `JWT_SECRET` diferente do que a
API está rodando atualmente — por isso a verificação de assinatura falhava
silenciosamente, retornando 401 genérico.

**Decisão:** limpar o cookie antigo e gerar um login novo resolveu
imediatamente. Como lição para produção: trocar o `JWT_SECRET` invalida
todas as sessões ativas — é um comportamento esperado, não um bug, mas vale
documentar para não gerar confusão em debugging futuro.

---

## 7. Build do TypeScript quebrando na Render (devDependencies puladas)

**Quando:** Dia 6 (26/08), durante o deploy do backend.

**O que aconteceu:** o build falhava com dezenas de erros do tipo "Cannot
find name 'process'/'console'/'fetch'", como se `@types/node` não
estivesse instalado — mesmo estando corretamente listado em
`devDependencies`. A causa: definir `NODE_ENV=production` nas variáveis de
ambiente da Render faz a plataforma setar `NPM_CONFIG_PRODUCTION=true`
automaticamente, e o `npm install` passa a pular `devDependencies`
silenciosamente.

**Decisão:** ajustar o Build Command da Render para
`npm install --include=dev && npx prisma generate && npm run build`,
forçando a instalação completa independente do `NODE_ENV`.

---

## 8. Conexão com o banco falhando (ENETUNREACH) na Render

**Quando:** Dia 6 (26/08), após o build da API passar.

**O que aconteceu:** a API não conseguia conectar no banco do Supabase
usando a connection string "direta" (`db.xxx.supabase.co:5432`), com erro
de rede `ENETUNREACH`. Essa string resolve por padrão para um endereço
IPv6, que não é suportado pela rede interna da Render.

**Decisão:** trocar pela connection string do **Session Pooler** do
Supabase (host `aws-0-<região>.pooler.supabase.com`, porta `6543`, com
`?pgbouncer=true`), que resolve em IPv4 e é compatível com a Render.

---

## 9. Login não persistia em produção (401 em /sessions/me)

**Quando:** Dia 6 (26/08), testando o fluxo completo já em produção.

**O que aconteceu:** o cookie de sessão era criado corretamente no login
(confirmado via DevTools), mas a chamada seguinte para `/sessions/me`
retornava 401, como se o cookie não existisse. A causa: em produção, o
front (Vercel) e o back (Render) estão em domínios diferentes de verdade
(não mais `localhost` nas duas pontas) — e o atributo `sameSite: 'lax'` do
cookie bloqueia esse tipo de envio entre domínios diferentes (cross-site).

**Decisão:** tornar o `sameSite` e o `secure` do cookie condicionais ao
ambiente: `sameSite: 'none'` e `secure: true` em produção (exige HTTPS, que
já temos nas duas plataformas), mantendo `'lax'`/`false` em desenvolvimento
local. O mesmo ajuste foi replicado no `clearCookie` do logout, que também
precisa desses atributos batendo para remover o cookie corretamente.

---

<!-- Próximos itens vão sendo adicionados aqui conforme aparecem -->