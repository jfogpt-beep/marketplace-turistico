import Stripe from "stripe";

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
) {
  const stripe = new Stripe(secret, { apiVersion: "2024-12-18.acacia" });
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function handleStripeWebhook(
  event: Stripe.Event,
  env: { db: any; stripeSecretKey: string }
) {
  const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2024-12-18.acacia" });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout completed:", session.id);
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("Payment succeeded:", invoice.id);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("Payment failed:", invoice.id);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Subscription deleted:", subscription.id);
      break;
    }
    default:
      console.log("Unhandled event:", event.type);
  }

  return { received: true };
}
