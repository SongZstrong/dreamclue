# DreamClue AI

DreamClue AI is a Next.js application for dream journaling, AI-assisted dream
interpretation, and searchable dream-symbol knowledge.

## Core Features

- Dream journal creation, editing, deletion, and AI interpretation
- Dreambook search powered by uploaded knowledge files and vector retrieval
- Stripe subscriptions, lifetime purchases, and credit packages
- Better Auth authentication with Google and GitHub OAuth support
- User dashboard, billing, credits, and admin management pages
- Localized English and Chinese content with `next-intl`

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Drizzle ORM with PostgreSQL
- pgvector-compatible knowledge retrieval
- Stripe payments
- Better Auth
- Fumadocs MDX content collections

## Development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Run checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

Rebuild MDX content:

```bash
pnpm content
```

## Deployment

The project is designed for GitHub-to-Vercel deployment without Docker.

Vercel settings:

- Framework Preset: `Next.js`
- Install Command: `corepack enable && pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: leave empty
- Node.js Version: 20 or newer

The same deployment commands are recorded in `vercel.json`.

## Environment

Create environment variables from `env.example`. At minimum, production needs:

- `NEXT_PUBLIC_BASE_URL`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Stripe price IDs
- AI provider keys used by the dream interpretation and Dreambook flows

Never commit `.env.local`, `.env.stripe.vercel`, or any live API keys.

## License

See `LICENSE`.
