import { loadEnvConfig } from '@next/env';
import { Stripe } from 'stripe';

loadEnvConfig(process.cwd());

type ExpectedPrice = {
  envName: string;
  label: string;
  amount: number;
  recurring?: 'month' | 'year';
};

const expectedPrices: ExpectedPrice[] = [
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY',
    label: 'Pro monthly',
    amount: 990,
    recurring: 'month',
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY',
    label: 'Pro yearly',
    amount: 9900,
    recurring: 'year',
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_LIFETIME',
    label: 'Lifetime',
    amount: 19900,
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_BASIC',
    label: 'Credits basic',
    amount: 990,
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STANDARD',
    label: 'Credits standard',
    amount: 1490,
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_PREMIUM',
    label: 'Credits premium',
    amount: 3990,
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_ENTERPRISE',
    label: 'Credits enterprise',
    amount: 6990,
  },
];

function mask(value: string): string {
  if (value.length <= 12) return '***';
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function fail(message: string): never {
  console.error(`Stripe config check failed: ${message}`);
  process.exit(1);
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    fail('STRIPE_SECRET_KEY is missing.');
  }

  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    fail('STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.');
  }

  console.log(
    `Stripe key mode: ${secretKey.startsWith('sk_live_') ? 'live' : 'test'}`
  );
  console.log(`Stripe key: ${mask(secretKey)}`);

  const stripe = new Stripe(secretKey);

  for (const expected of expectedPrices) {
    const priceId = process.env[expected.envName];

    if (!priceId || priceId.includes('placeholder')) {
      fail(`${expected.envName} is missing or still uses a placeholder value.`);
    }

    if (!priceId.startsWith('price_')) {
      fail(
        `${expected.envName} must be a Stripe price ID starting with price_.`
      );
    }

    const price = await stripe.prices.retrieve(priceId);
    const recurringInterval = price.recurring?.interval;
    const expectedType = expected.recurring ? 'recurring' : 'one-time';
    const actualType = price.recurring ? 'recurring' : 'one-time';

    if (!price.active) {
      fail(`${expected.label} price ${priceId} is not active.`);
    }

    if (price.unit_amount !== expected.amount) {
      fail(
        `${expected.label} price ${priceId} amount is ${price.unit_amount}, expected ${expected.amount}.`
      );
    }

    if (expected.recurring && recurringInterval !== expected.recurring) {
      fail(
        `${expected.label} price ${priceId} interval is ${recurringInterval}, expected ${expected.recurring}.`
      );
    }

    if (!expected.recurring && price.recurring) {
      fail(`${expected.label} price ${priceId} must be one-time.`);
    }

    console.log(
      `ok ${expected.label}: ${mask(priceId)} ${price.currency.toUpperCase()} ${price.unit_amount} ${actualType}${recurringInterval ? `/${recurringInterval}` : ''}`
    );

    if (expectedType !== actualType) {
      fail(`${expected.label} expected ${expectedType}, got ${actualType}.`);
    }
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn(
      'warning: STRIPE_WEBHOOK_SECRET is missing. Checkout can open, but webhook fulfillment will not work.'
    );
  } else if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    fail('STRIPE_WEBHOOK_SECRET must start with whsec_.');
  } else {
    console.log(
      `ok webhook secret: ${mask(process.env.STRIPE_WEBHOOK_SECRET)}`
    );
  }

  console.log('Stripe config check completed.');
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Unknown Stripe config check error'
  );
  process.exit(1);
});
