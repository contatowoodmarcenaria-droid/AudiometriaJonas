# Audiometria Ocupacional

Sistema de gerenciamento de exames audiométricos ocupacionais para fonoaudiólogos.

## Stack

- **Frontend:** React 19, Tailwind CSS 4, shadcn/ui, Recharts, wouter
- **Backend:** Express, tRPC 11, Drizzle ORM
- **Banco de dados:** MySQL
- **Autenticação:** Supabase Auth + sessão JWT local (email/senha)
- **PDF:** jsPDF

## Requisitos

- Node.js 20+
- pnpm (ou npm)
- Banco MySQL acessível
- Projeto Supabase configurado (Auth habilitado)

## Configuração

1. Clone o repositório
2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Preencha as variáveis no `.env`
4. Instale as dependências:

```bash
pnpm install
```

5. Execute as migrations do banco:

```bash
pnpm db:push
```

6. Inicie em modo desenvolvimento:

```bash
pnpm dev
```

O app estará em `http://localhost:3000`.

## Build e Produção

```bash
pnpm build
pnpm start
```

## Deploy na Vercel

Este projeto roda como um servidor Node.js custom (Express). Para deploy na Vercel:

1. Crie o projeto na Vercel apontando para o repositório GitHub
2. Configure as variáveis de ambiente no painel da Vercel (todas do `.env.example`)
3. Configure:
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`
4. O `start` será `node dist/index.js`

> **Nota:** A Vercel funciona melhor com serverless. Para um servidor Express persistente, considere também Railway, Render ou Fly.io como alternativas.

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string MySQL |
| `JWT_SECRET` | Segredo para assinatura de cookies de sessão |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `VITE_SUPABASE_URL` | Mesma URL do Supabase (exposta ao frontend) |
| `VITE_SUPABASE_ANON_KEY` | Mesma chave anônima (exposta ao frontend) |
| `PORT` | Porta do servidor (padrão: 3000) |

## Estrutura do Projeto

```
├── client/            # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes UI (shadcn + custom)
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilitários (trpc client, supabase, cálculos)
│   │   └── pages/       # Páginas da aplicação
│   └── index.html
├── server/            # Backend Express + tRPC
│   ├── _core/           # Infraestrutura (auth, session, trpc, vite)
│   ├── routers/         # Sub-routers tRPC
│   ├── db.ts            # Queries do banco
│   └── routers.ts       # Router principal
├── shared/            # Código compartilhado client/server
├── drizzle/           # Schema e migrations do banco
└── package.json
```
