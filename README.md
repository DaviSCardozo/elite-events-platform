# Elite Events Platform

Desafio Técnico — Elite Dev 2026
Plataforma Full Stack de Eventos e Ingressos

> Status: em desenvolvimento (20/08 a 26/08/2026)

## Sobre o projeto

<!-- 2-3 frases explicando o que o sistema faz, ao estilo do enunciado:
organizador publica evento, cliente reserva e paga simulado, recebe ingresso
com QR, portaria valida na entrada. Preencher no fim, quando o fluxo estiver
completo e for mais fácil descrever com precisão. -->

## Stack utilizada

- **Back-end:** Node.js + Fastify + Prisma + PostgreSQL
- **Front-end:** Next.js + Tailwind + Shadcn UI
- **Infra:** Docker Compose
- **Deploy:** Vercel (front) + Render/Supabase (back) <!-- confirmar links no Dia 6 -->

## Como rodar o projeto localmente

<!-- Preencher com passo a passo real e testado, incluindo:
1. Clonar o repositório
2. Configurar variáveis de ambiente (.env a partir do .env.example)
3. Subir o banco: docker-compose up -d
4. Rodar migrations + seed
5. Subir a API
6. Subir o front
Testar em máquina "limpa" se possível antes de finalizar essa seção. -->

## Dados de teste (seed)

<!-- Tabela de logins semeados: organizador, 2 clientes, portaria, 1 evento -->

| Papel | E-mail | Senha |
|---|---|---|
| Organizador | | |
| Cliente 1 | | |
| Cliente 2 | | |
| Portaria | | |

## Decisões técnicas

<!-- Puxar da tabela de decisões do docs/PRD.md, resumido para o avaliador.
Ex: por que sem CASL, por que reserva por quantidade em vez de mapa de
assentos, por que Prisma fixado na v6, etc. -->

## Engenharia de Contexto & Uso de IA

<!-- Seção obrigatória pelo edital. Explicar:
- Que ferramentas de IA foram usadas (Antigravity, ChatGPT)
- Em que partes do projeto (boilerplate, componentes de interface)
- O que foi feito/decidido manualmente (lock de concorrência, validação dos
  4 estados da portaria, revisão de código)
- Referenciar docs/PRD.md e docs/registro-de-problemas.md como artefatos
  versionados do processo -->

## O que não funcionou como esperado

<!-- Ser transparente aqui conta a favor, não contra. Puxar de
docs/registro-de-problemas.md o que for relevante para o avaliador saber
antes de rodar o projeto. -->

## Link do deploy

<!-- Preencher no Dia 6 -->

- Front: 
- Back: 
