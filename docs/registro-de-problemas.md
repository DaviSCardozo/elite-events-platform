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

<!-- Próximos itens vão sendo adicionados aqui conforme aparecem -->
