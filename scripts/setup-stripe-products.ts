import { loadEnvConfig } from '@next/env';
import { writeFile } from 'node:fs/promises';
import { Stripe } from 'stripe';

loadEnvConfig(process.cwd());

type ProductConfig = {
  key: string;
  name: string;
  description: string;
};

type PriceConfig = {
  envName: string;
  lookupKey: string;
  label: string;
  productKey: string;
  amount: number;
  currency: string;
  recurring?: 'month' | 'year';
};

const appDomain = 'https://dreamclueai.com';

const products: ProductConfig[] = [
  {
    key: 'dreamclue_pro',
    name: 'DreamClue AI Pro',
    description: 'Unlimited AI dream interpretation and Dreambook searches.',
  },
  {
    key: 'dreamclue_lifetime',
    name: 'DreamClue AI Lifetime',
    description: 'Lifetime access to DreamClue AI premium features.',
  },
  {
    key: 'dreamclue_credits',
    name: 'DreamClue AI Credits',
    description: 'Credit packs for additional dream analysis usage.',
  },
];

const prices: PriceConfig[] = [
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY',
    lookupKey: 'dreamclue_pro_monthly_usd',
    label: 'Pro monthly',
    productKey: 'dreamclue_pro',
    amount: 990,
    currency: 'usd',
    recurring: 'month',
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY',
    lookupKey: 'dreamclue_pro_yearly_usd',
    label: 'Pro yearly',
    productKey: 'dreamclue_pro',
    amount: 9900,
    currency: 'usd',
    recurring: 'year',
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_LIFETIME',
    lookupKey: 'dreamclue_lifetime_usd',
    label: 'Lifetime',
    productKey: 'dreamclue_lifetime',
    amount: 19900,
    currency: 'usd',
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_BASIC',
    lookupKey: 'dreamclue_credits_basic_usd',
    label: 'Credits basic',
    productKey: 'dreamclue_credits',
    amount: 990,
    currency: 'usd',
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STANDARD',
    lookupKey: 'dreamclue_credits_standard_usd',
    label: 'Credits standard',
    productKey: 'dreamclue_credits',
    amount: 1490,
    currency: 'usd',
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_PREMIUM',
    lookupKey: 'dreamclue_credits_premium_usd',
    label: 'Credits premium',
    productKey: 'dreamclue_credits',
    amount: 3990,
    currency: 'usd',
  },
  {
    envName: 'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_ENTERPRISE',
    lookupKey: 'dreamclue_credits_enterprise_usd',
    label: 'Credits enterprise',
    productKey: 'dreamclue_credits',
    amount: 6990,
    currency: 'usd',
  },
];

const webhookEvents: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed',
  'invoice.paid',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

function mask(value: string): string {
  if (value.length <= 12) return '***';
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function fail(message: string): never {
  console.error(`Stripe setup failed: ${message}`);
  process.exit(1);
}

async function findOrCreateProduct(
  stripe: Stripe,
  config: ProductConfig
): Promise<Stripe.Product> {
  const existingProducts = await stripe.products.list({
    active: true,
    limit: 100,
  });
  const existingProduct = existingProducts.data.find(
    (product) => product.metadata.dreamclue_product === config.key
  );

  if (existingProduct) {
    console.log(`ok product ${config.name}: ${mask(existingProduct.id)}`);
    return existingProduct;
  }

  const product = await stripe.products.create({
    name: config.name,
    description: config.description,
    metadata: {
      dreamclue_product: config.key,
      app: 'dreamclueai',
    },
  });

  console.log(`created product ${config.name}: ${mask(product.id)}`);
  return product;
}

async function findOrCreatePrice(
  stripe: Stripe,
  config: PriceConfig,
  productId: string
): Promise<Stripe.Price> {
  const existingPrices = await stripe.prices.list({
    active: true,
    lookup_keys: [config.lookupKey],
    limit: 1,
  });
  const existingPrice = existingPrices.data[0];

  if (existingPrice) {
    const interval = existingPrice.recurring?.interval;

    if (existingPrice.unit_amount !== config.amount) {
      fail(
        `${config.label} existing price ${existingPrice.id} has amount ${existingPrice.unit_amount}, expected ${config.amount}. Create a new lookup key or archive the old price.`
      );
    }

    if (config.recurring && interval !== config.recurring) {
      fail(
        `${config.label} existing price ${existingPrice.id} has interval ${interval}, expected ${config.recurring}.`
      );
    }

    if (!config.recurring && existingPrice.recurring) {
      fail(
        `${config.label} existing price ${existingPrice.id} must be one-time.`
      );
    }

    console.log(`ok price ${config.label}: ${mask(existingPrice.id)}`);
    return existingPrice;
  }

  const priceParams: Stripe.PriceCreateParams = {
    product: productId,
    currency: config.currency,
    unit_amount: config.amount,
    lookup_key: config.lookupKey,
    metadata: {
      app: 'dreamclueai',
      env_name: config.envName,
    },
  };

  if (config.recurring) {
    priceParams.recurring = {
      interval: config.recurring,
    };
  }

  const price = await stripe.prices.create(priceParams);
  console.log(`created price ${config.label}: ${mask(price.id)}`);
  return price;
}

async function findOrCreateWebhook(stripe: Stripe, baseUrl: string) {
  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/stripe`;
  const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existingEndpoint = existingEndpoints.data.find(
    (endpoint) => endpoint.url === webhookUrl
  );

  if (existingEndpoint) {
    await stripe.webhookEndpoints.update(existingEndpoint.id, {
      enabled_events: webhookEvents,
    });

    console.log(`ok webhook endpoint: ${webhookUrl}`);
    console.log(
      'Existing webhook secrets cannot be retrieved by API. Use the Stripe Dashboard endpoint page to reveal/copy its signing secret.'
    );
    return {
      endpoint: existingEndpoint,
      secret: null,
    };
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: webhookEvents,
    description: 'DreamClue AI production webhook',
    metadata: {
      app: 'dreamclueai',
    },
  });

  const secret =
    'secret' in endpoint && typeof endpoint.secret === 'string'
      ? endpoint.secret
      : null;

  console.log(`created webhook endpoint: ${webhookUrl}`);
  return {
    endpoint,
    secret,
  };
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const outputFile =
    process.env.STRIPE_SETUP_OUTPUT_FILE || '.env.stripe.vercel';
  const baseUrl =
    process.env.STRIPE_SETUP_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    appDomain;

  if (!secretKey) {
    fail('STRIPE_SECRET_KEY is missing.');
  }

  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    fail('STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.');
  }

  console.log(
    `Stripe setup mode: ${secretKey.startsWith('sk_live_') ? 'live' : 'test'}`
  );
  console.log(`Stripe key: ${mask(secretKey)}`);
  console.log(`Webhook base URL: ${baseUrl}`);

  const stripe = new Stripe(secretKey);
  const productByKey = new Map<string, Stripe.Product>();
  const priceByEnvName = new Map<string, string>();

  for (const productConfig of products) {
    const product = await findOrCreateProduct(stripe, productConfig);
    productByKey.set(productConfig.key, product);
  }

  for (const priceConfig of prices) {
    const product = productByKey.get(priceConfig.productKey);
    if (!product) {
      fail(`Product ${priceConfig.productKey} was not created.`);
    }

    const price = await findOrCreatePrice(stripe, priceConfig, product.id);
    priceByEnvName.set(priceConfig.envName, price.id);
  }

  const webhook = await findOrCreateWebhook(stripe, baseUrl);

  const envLines = [
    `NEXT_PUBLIC_BASE_URL="${baseUrl.replace(/\/$/, '')}"`,
    `STRIPE_SECRET_KEY="${secretKey}"`,
  ];

  if (publishableKey) {
    envLines.push(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${publishableKey}"`);
  }

  if (webhook.secret) {
    envLines.push(`STRIPE_WEBHOOK_SECRET="${webhook.secret}"`);
  } else {
    envLines.push(
      'STRIPE_WEBHOOK_SECRET="<copy from Stripe Dashboard webhook endpoint>"'
    );
  }

  for (const config of prices) {
    envLines.push(`${config.envName}="${priceByEnvName.get(config.envName)}"`);
  }

  await writeFile(outputFile, `${envLines.join('\n')}\n`, 'utf-8');

  console.log(`\nWrote Vercel env vars to ${outputFile}`);
  console.log('Non-secret Vercel values:');
  console.log(`NEXT_PUBLIC_BASE_URL="${baseUrl.replace(/\/$/, '')}"`);
  if (publishableKey) {
    console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${mask(publishableKey)}"`);
  }
  console.log(`STRIPE_SECRET_KEY="${mask(secretKey)}"`);
  if (webhook.secret) {
    console.log(`STRIPE_WEBHOOK_SECRET="${mask(webhook.secret)}"`);
  } else {
    console.log(
      'STRIPE_WEBHOOK_SECRET="<copy from Stripe Dashboard webhook endpoint>"'
    );
  }
  for (const config of prices) {
    console.log(`${config.envName}="${priceByEnvName.get(config.envName)}"`);
  }

  console.log(
    '\nNext step: run pnpm stripe:check with the generated env values.'
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Unknown Stripe setup error'
  );
  process.exit(1);
});
