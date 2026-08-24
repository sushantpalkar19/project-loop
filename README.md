# Project LOOP

> AI Customer-Feedback Intelligence Platform

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js / NextAuth
- **Validation:** Zod
- **Deployment:** Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/project_loop?schema=public"
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev
```

This creates all tables (User, Workspace, WorkspaceMember, Feedback) in your PostgreSQL database.

### 4. Seed Development Data

```bash
npx prisma db seed
```

Creates:
- 1 development workspace
- 3 users (admin, analyst, viewer) with roles
- 5 sample feedback records

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start dev server                      |
| `npm run build`      | Production build                      |
| `npm run start`      | Start production server               |
| `npm run lint`       | Run ESLint                            |
| `npm run typecheck`  | Run TypeScript checks                 |
| `npm run db:migrate` | Run Prisma migrations (dev)           |
| `npm run db:generate`| Regenerate Prisma client              |
| `npm run db:seed`    | Seed database with dev data           |
| `npm run db:studio`  | Open Prisma Studio (DB browser)       |
| `npm run db:reset`   | Reset database and re-seed            |

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Development seed data
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router pages
│   ├── lib/
│   │   └── db.ts              # Prisma client singleton
│   ├── generated/prisma/      # Auto-generated Prisma client
│   └── types/                 # TypeScript type definitions
├── .env.example               # Environment variable template
└── prisma.config.ts           # Prisma configuration
```

## Development Notes

- **Prisma Client** is imported from `@/lib/db` — never import `@prisma/client` directly.
- The Prisma client singleton prevents multiple instances in development hot-reload.
- **Never commit `.env` or `.env.local`** — they are gitignored.
- Dev seed credentials are documented in `prisma/seed.ts` — change them for any shared environment.

## License

Private — All rights reserved.
