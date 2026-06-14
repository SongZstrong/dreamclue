# Stripe Setup

Use Stripe as the primary payment provider for DreamClue AI.

## Security

Do not commit Stripe secrets. Keep them in `.env.local` for local development
and in Vercel Environment Variables for production.

If a live secret key is pasted into chat, email, logs, or source control, rotate
it in the Stripe Dashboard before using it in production.

## Production Domain

The production domain is:

```text
https://dreamclueai.com
```

The Stripe webhook endpoint is:

```text
https://dreamclueai.com/api/webhooks/stripe
```

## Create Products, Prices, And Webhook

Set a rotated Stripe secret key in `.env.local`:

```env
STRIPE_SECRET_KEY="sk_test_or_sk_live_xxx"
STRIPE_SETUP_BASE_URL="https://dreamclueai.com"
```

Then run:

```bash
pnpm stripe:setup
```

The script creates or reuses these Stripe prices:

- Pro monthly: USD 9.90, recurring monthly
- Pro yearly: USD 99.00, recurring yearly
- Lifetime: USD 199.00, one-time
- Credits basic: USD 9.90, one-time
- Credits standard: USD 14.90, one-time
- Credits premium: USD 39.90, one-time
- Credits enterprise: USD 69.90, one-time

It also creates or updates the production webhook endpoint for:

- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the environment variables printed by the script into Vercel.

## Verify Stripe Configuration

After setting all Stripe env vars, run:

```bash
pnpm stripe:check
```

This validates:

- `STRIPE_SECRET_KEY`
- all `NEXT_PUBLIC_STRIPE_PRICE_*` IDs
- price amounts
- recurring vs one-time setup
- recurring interval
- `STRIPE_WEBHOOK_SECRET`

## Required Vercel Environment Variables

```env
NEXT_PUBLIC_BASE_URL="https://dreamclueai.com"
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY="price_xxx"
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY="price_xxx"
NEXT_PUBLIC_STRIPE_PRICE_LIFETIME="price_xxx"
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_BASIC="price_xxx"
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STANDARD="price_xxx"
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_PREMIUM="price_xxx"
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_ENTERPRISE="price_xxx"
```

## Local Webhook Testing

For local development, keep:

```env
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

Run the app:

```bash
pnpm dev
```

Forward Stripe webhooks locally:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the generated `whsec_...` value into `.env.local`.

## Production Checkout QA

After deployment:

1. Sign in to `https://dreamclueai.com`.
2. Open `/pricing`.
3. Purchase Pro monthly.
4. Confirm Stripe redirects back to `/payment`.
5. Confirm the webhook updates the `payment` table with `paid=true`.
6. Confirm `/settings/billing` shows Pro.
7. Confirm AI dream analysis and Dreambook search are unlimited for the user.
