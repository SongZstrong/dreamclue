# DreamClue AI Vercel Deployment

This project is intended to deploy from GitHub to Vercel without Docker.

## Vercel Project Settings

- Framework Preset: `Next.js`
- Root Directory: repository root
- Install Command: `corepack enable && pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: leave empty; Next.js uses `.next`
- Node.js Version: Node.js 20 or newer

These values are also recorded in `vercel.json`.

## Required Environment Variables

Set these in Vercel Project Settings -> Environment Variables for Production.

```bash
NEXT_PUBLIC_BASE_URL="https://dreamclueai.com"
DATABASE_URL=""
BETTER_AUTH_SECRET=""

STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY="price_1Ti9gvG1ptRcqB9OJyf3MQOD"
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY="price_1Ti9gwG1ptRcqB9OKy2sL2iM"
NEXT_PUBLIC_STRIPE_PRICE_LIFETIME="price_1Ti9gxG1ptRcqB9O42bX3HcF"
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_BASIC="price_1Ti9gyG1ptRcqB9O7XubyDgt"
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STANDARD="price_1Ti9h0G1ptRcqB9OndGk6yCu"
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_PREMIUM="price_1Ti9h1G1ptRcqB9Olqaw8mnC"
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_ENTERPRISE="price_1Ti9h2G1ptRcqB9OwvhDEusm"

SILICONFLOW_API_KEY=""
SILICONFLOW_BASE_URL="https://api.siliconflow.cn/v1"
EMBEDDING_MODEL="Qwen/Qwen3-Embedding-8B"
EMBEDDING_DIMENSION="4096"
FREE_DAILY_DREAM_ANALYSIS_LIMIT="3"
FREE_DAILY_DREAMBOOK_QUERY_LIMIT="1"
```

The generated local file `.env.stripe.vercel` contains the Stripe values that
were created by `pnpm stripe:setup`. Do not commit that file.

The previously pasted Stripe live secret key should be considered leaked.
Rotate it in Stripe before launch, then set the new key in Vercel as
`STRIPE_SECRET_KEY`.

## Database

Use a hosted Postgres database with the pgvector extension enabled. Supabase
Postgres is suitable.

Before production traffic, apply the schema:

```bash
pnpm db:migrate
```

If you are using a fresh Supabase database and prefer direct sync during setup:

```bash
pnpm db:push
```

Use only one of these production paths consistently. For launch, migrations are
safer once the schema is stable.

## Stripe Webhook

The Stripe webhook endpoint should be:

```text
https://dreamclueai.com/api/webhooks/stripe
```

Events required by the app:

```text
checkout.session.completed
invoice.payment_succeeded
customer.subscription.updated
customer.subscription.deleted
```

After rotating the Stripe secret key, verify the setup with:

```bash
pnpm stripe:check
```

## Optional Environment Variables

Enable these when the matching feature is ready:

```bash
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
RESEND_API_KEY=""
BEEHIIV_API_KEY=""
BEEHIIV_PUBLICATION_ID=""
STORAGE_REGION="auto"
STORAGE_BUCKET_NAME=""
STORAGE_ACCESS_KEY_ID=""
STORAGE_SECRET_ACCESS_KEY=""
STORAGE_ENDPOINT=""
STORAGE_PUBLIC_URL=""
CRON_JOBS_USERNAME=""
CRON_JOBS_PASSWORD=""
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=""
NEXT_PUBLIC_CLARITY_PROJECT_ID=""
```

## Do Not Commit

These are local or generated artifacts:

```text
.env*
.next/
node_modules/
.source/
.vercel/
.turbo/
.cache/
.pnpm-store/
uploads/
data/
```

