# Elite Events Platform

Desafio Técnico — Elite Dev 2026
Plataforma Full Stack de Eventos e Ingressos

## Sobre o projeto

Plataforma onde um **Organizador** publica eventos a partir de um catálogo de
filmes (integração com a TMDb), o **Cliente** navega pelos eventos, reserva
ingressos, paga de forma simulada e recebe um ingresso com QR code que pode
compartilhar por link, e a **Portaria** valida o ingresso na entrada — por
leitura de câmera ou digitação manual — com retorno claro em 4 estados
(válido, já utilizado, inválido, evento errado).

## Stack utilizada

- **Back-end:** Node.js + Fastify + Prisma (fixado na v6, ver seção de
  decisões técnicas) + PostgreSQL
- **Front-end:** Next.js 15 (App Router) + Tailwind CSS + Shadcn UI
- **Autenticação:** JWT via cookie httpOnly, com RBAC simples (sem CASL)
- **Infra local:** Docker Compose (apenas o banco PostgreSQL)
- **Leitura de QR:** `html5-qrcode` (câmera) + `qrcode.react` (geração)

## Como rodar o projeto localmente

### Pré-requisitos

- Node.js 20+
- Docker (para o banco de dados)

### 1. Clonar o repositório

```bash
git clone https://github.com/DaviSCardozo/elite-events-platform.git
cd elite-events-platform
```

### 2. Subir o banco de dados

Na raiz do projeto:

```bash
docker-compose up -d
```

Isso sobe um PostgreSQL local. O Docker Compose neste projeto cobre **apenas
o banco de dados** — a API e o front rodam diretamente com `npm run dev`
(decisão de simplicidade, ver seção de decisões técnicas).

### 3. Configurar e rodar a API

```bash
cd api
npm install
```

Crie um arquivo `.env` na pasta `api/` com base no `.env.example`, ajustando
se necessário (os valores padrão já funcionam com o `docker-compose.yml`
deste repositório):

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/eventos_db
JWT_SECRET=uma-chave-secreta-de-sua-escolha
CORS_ORIGIN=http://localhost:3000
TMDB_API_KEY=sua-chave-da-tmdb
```

A `TMDB_API_KEY` é obrigatória (a API não sobe sem ela) — gere uma
gratuitamente em [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api),
usando a "API Key (v3 auth)".

Rode as migrations e o seed:

```bash
npx prisma migrate dev
npx prisma db seed
```

Suba a API:

```bash
npm run dev
```

A API sobe em `http://localhost:3334`.

### 4. Configurar e rodar o front-end

Em outro terminal, na raiz do projeto:

```bash
cd web
npm install
```

Crie um arquivo `.env.local` na pasta `web/`:

```
NEXT_PUBLIC_API_URL=http://localhost:3334/api/v1
```

Suba o front:

```bash
npm run dev
```

O front sobe em `http://localhost:3000`.

## Dados de teste (seed)

Todos os usuários semeados usam a mesma senha, de propósito, para facilitar
os testes de quem for avaliar o projeto:

| Papel | E-mail | Senha |
|---|---|---|
| Organizador | organizador@eventos.com | 123456 |
| Cliente 1 | cliente1@eventos.com | 123456 |
| Cliente 2 | cliente2@eventos.com | 123456 |
| Portaria | portaria@eventos.com | 123456 |

Um evento ("Vingadores: Ultimato — Sessão Especial") já vem publicado com
50 ingressos disponíveis.

## Decisões técnicas

Escopo e arquitetura foram deliberadamente simplificados para o prazo de 7
dias, priorizando um fluxo completo e testado sobre features parciais.

| Decisão | Escolhido | Descartado | Motivo |
|---|---|---|---|
| Monorepo | Pastas simples `api/` e `web/` | TurboRepo | Sem necessidade de build pipeline/cache compartilhado para 2 apps |
| Permissões | Middleware de role simples (`app.authorize([...papeis])`) | CASL | 3 papéis fixos, sem regras condicionais — CASL resolveria um problema que não existe aqui |
| Reserva | Quantidade de ingressos (modelo pista) | Mapa de assentos interativo | Edital permite qualquer um dos dois; quantidade reduz complexidade de UI sem abrir mão do requisito de concorrência |
| Reserva + Pagamento | Ação atômica única (reserva já entra com decisão de pagamento) | Reserva temporária com expiração, separada do pagamento | Evita a complexidade de gerenciar reservas expiradas, mantendo a mesma garantia contra venda duplicada |
| Lock de concorrência | `SELECT ... FOR UPDATE` dentro de `prisma.$transaction` | Isolamento Serializable com retry | Mais simples de raciocinar e explicar: trava a linha do evento, concorrentes esperam a vez, sem necessidade de lógica de nova tentativa |
| Estoque de ingressos | Derivado contando `Ticket`s reais | Contador solto no `Event` | Elimina risco de o número ficar dessincronizado da realidade |
| QR code | Código único (UUID aleatório) do ingresso, mesmo valor usado na digitação manual | Payload JWT completo no QR de validação | UUID v4 já é praticamente não adivinhável; simplifica a paridade entre leitura por câmera e digitação manual |
| Link compartilhável | Token JWT assinado, separado do código do QR de validação | — | Previne enumeração de ingressos por terceiros ao navegar por `/ticket/:token` |
| Prisma | Fixado na v6 | v7 (mais recente) | v7 mudou a forma de configuração (`prisma.config.ts`) de forma muito recente para o prazo do desafio — decisão de estabilidade |
| Catálogo externo | TMDb | Ticketmaster Discovery | Escolha única, TMDb cobre o caso de uso de filmes/shows |
| Docker Compose | Cobre apenas o banco PostgreSQL | Containerizar API e front também | Reduz complexidade de rede entre containers durante o desenvolvimento; API e front já rodam de forma simples e rápida com `npm run dev` |

## Engenharia de Contexto & Uso de IA

Este projeto foi construído inteiramente em parceria com uma IA (Claude, da
Anthropic), atuando como tech lead e par de programação ao longo de toda a
semana — sem uso de IDEs com IA integrada (Cursor, Antigravity, etc.). O
fluxo de trabalho foi:

1. Planejamento e priorização do escopo em conversa, incluindo cortes
   deliberados de complexidade (CASL, TurboRepo, mapa de assentos) para
   caber no prazo de 7 dias.
2. Geração de cada trecho de código pela IA, revisado e colado manualmente
   pelo desenvolvedor no editor.
3. Teste manual estruturado de cada funcionalidade (Postman para as rotas
   de API, navegador para o front) antes de qualquer commit — nenhuma
   função foi considerada pronta sem esse passo.
4. Debug conjunto de problemas reais encontrados no caminho (detalhados em
   `docs/registro-de-problemas.md`), com a IA ajudando a diagnosticar e o
   desenvolvedor executando e confirmando cada correção.
5. Revisão de código antes de cada commit importante, e uma auditoria final
   do escopo contra o edital (foi nessa auditoria que a integração real com
   a TMDb, inicialmente esquecida, foi identificada e implementada).

**O que foi decidido e validado manualmente pelo desenvolvedor, em cada
etapa:**
- A modelagem do schema Prisma (relações entre User, Event, Order, Ticket)
- A lógica de lock de concorrência (`FOR UPDATE`) e sua ordem dentro da
  transação — decisiva para a garantia de não venda duplicada
- A separação entre código de QR (validação) e token JWT (link público)
- Os 4 estados de validação da portaria e sua ordem de checagem
- Todos os testes manuais de cada funcionalidade antes do commit

Os arquivos `docs/PRD.md` (planejamento inicial) e
`docs/registro-de-problemas.md` (registro de problemas reais encontrados e
decisões tomadas ao longo do desenvolvimento) estão versionados neste
repositório como evidência desse processo.

## O que não funcionou como esperado / limitações conhecidas

- O painel do organizador permite apenas **criar** eventos — edição e
  cancelamento com devolução ao estoque (itens opcionais do edital) não
  foram implementados por priorização de tempo.
- Não há um link de navegação visível para `/organizador/novo-evento` ou
  `/portaria` a partir da Home — essas rotas existem e funcionam, mas
  precisam ser acessadas diretamente pela URL.
- Testes automatizados (Vitest) não foram escritos; a cobertura de qualidade
  vem de testes manuais estruturados, documentados durante o desenvolvimento.
- O lock de concorrência (`FOR UPDATE`) foi validado funcionalmente em todos
  os caminhos possíveis (aprovação, recusa, estoque insuficiente), mas não
  sob um teste de carga com requisições verdadeiramente simultâneas.

## Link do deploy

Não realizado — projeto avaliado em ambiente local, conforme instruções de
execução acima.
