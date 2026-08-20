# PRD — Elite Events Platform

## Contexto

Desafio técnico da **Elite Dev 2026** (Verzel), nível júnior fullstack.
Recebido em 19/08/2026 às 10h. Entrega até 26/08/2026 às 10h (7 dias corridos).

## Proposta

Plataforma de eventos e ingressos: um **Organizador** publica eventos a partir de um
catálogo externo (TMDb), o **Cliente** navega, reserva, paga de forma simulada e
recebe um ingresso com QR code que pode compartilhar por link, e a **Portaria**
valida o ingresso na entrada.

## Princípio norteador

> "Preferimos o fluxo inteiro simples e completo a um pedaço sofisticado com telas
> pela metade." — trecho do edital.

Escopo deliberadamente enxuto. O critério de avaliação não é volume entregue, é
qualidade de decisão: o que foi escolhido, o que foi descartado, e por quê.

## Papéis (RBAC)

- **ORGANIZER**: cria e gerencia eventos.
- **CUSTOMER**: navega, reserva, paga, recebe ingresso.
- **DOORMAN**: valida ingressos na entrada.

Implementado como middleware simples lendo `role` do JWT — sem biblioteca de
permissões dinâmicas (CASL avaliado e descartado: complexidade desnecessária
para 3 papéis fixos e sem regras de acesso condicionais).

## Decisões técnicas e o que foi descartado

| Decisão | Escolhido | Descartado | Motivo |
|---|---|---|---|
| Monorepo | Pastas simples `api/` e `web/` | TurboRepo | Sem necessidade de build pipeline/cache compartilhado para 2 apps |
| Permissões | Middleware de role simples | CASL | 3 papéis fixos, sem regras condicionais — CASL resolveria um problema que não existe aqui |
| Reserva | Quantidade de ingressos (modelo pista) | Mapa de assentos interativo | Edital permite qualquer um dos dois; quantidade reduz complexidade de UI sem abrir mão do requisito de concorrência |
| Catálogo externo | TMDb | Ticketmaster Discovery | Escolha única, TMDb cobre o caso de uso de filmes/shows |
| Pagamento | Simulado (aprovar/recusar) | Integração real de sandbox | Não exigido; foco no fluxo, não na integração de pagamento |

## Stack

- **Back-end:** Node.js + Fastify + Prisma + PostgreSQL
- **Front-end:** Next.js 15 + Tailwind + Shadcn UI
- **Infra:** Docker Compose (Postgres local), deploy Vercel (front) + Render/Supabase (back)
- **Auth:** JWT + bcrypt
- **QR Code:** JWT assinado (payload do ingresso) + lib `qrcode`

## Requisitos não negociáveis (do edital)

- Mesmo lugar/ingresso nunca vendido duas vezes → `prisma.$transaction` no momento da reserva.
- QR code não forjável → payload assinado com JWT, validado no back no momento do scan.
- Ingresso não validado duas vezes na portaria → checagem de status antes de marcar como usado.
- Dados semeados: 1 organizador, 2 clientes, 1 portaria, 1 evento publicado com ingressos disponíveis.
- README detalhado, incluindo o que não funcionou como esperado (se houver).

## Uso de IA

Projeto conduzido com apoio de IA (Antigravity/ChatGPT) atuando como "Dev
Orquestrador": IA gera boilerplate e componentes de interface; decisões de
arquitetura, regras de negócio críticas (lock de concorrência, validação de
estados na portaria) e revisão de código são de responsabilidade humana.
Detalhamento completo na seção "Engenharia de Contexto & Uso de IA" do README
final.

## Fora do escopo (explicitamente, por decisão)

Nota fiscal, revenda entre usuários, aplicativo nativo, recuperação de senha,
envio de ingresso por e-mail — todos citados no edital como "não precisa fazer".
