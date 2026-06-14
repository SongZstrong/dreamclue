export function validateStripeCheckoutConfig(priceId: string): string | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return 'Stripe is not configured: STRIPE_SECRET_KEY is missing.';
  }

  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    return 'Stripe is not configured: STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.';
  }

  if (!priceId || priceId.includes('placeholder')) {
    return 'Stripe is not configured: replace the placeholder price ID with a real Stripe price ID.';
  }

  if (!priceId.startsWith('price_')) {
    return 'Stripe is not configured: Stripe price IDs must start with price_.';
  }

  return null;
}
