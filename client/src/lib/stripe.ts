import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> | null {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  
  if (!publicKey) {
    console.warn('[Stripe] Public key not configured');
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publicKey);
  }

  return stripePromise;
}

export function resetStripePromise() {
  stripePromise = null;
}
