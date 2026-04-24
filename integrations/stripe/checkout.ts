/**
 * Stripe Checkout Sessions
 * Crea sessions de Checkout para suscripciones (3 planes) y destacados individuales
 */

export interface CheckoutSessionOptions {
  type: "subscription" | "highlight";
  priceId: string;           // Stripe Price ID
  customerId?: string;        // Stripe Customer ID (opcional, si ya existe)
  customerEmail?: string;   // Email del usuario (si no tiene customerId)
  agencyId: string;         // ID interno de la agencia
  metadata?: Record<string, string>; // Datos adicionales
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

const STRIPE_API = "https://api.stripe.com/v1";

/**
 * Crea una sesión de Stripe Checkout
 */
export async function createCheckoutSession(
  stripeSecretKey: string,
  options: CheckoutSessionOptions
): Promise<CheckoutSessionResult> {
  const body = new URLSearchParams();

  // Modo de pago
  if (options.type === "subscription") {
    body.set("mode", "subscription");
    body.set("line_items[0][quantity]", "1");
  } else {
    body.set("mode", "payment");
    body.set("line_items[0][quantity]", "1");
  }

  body.set("line_items[0][price]", options.priceId);
  body.set("success_url", options.successUrl);
  body.set("cancel_url", options.cancelUrl);

  // Customer
  if (options.customerId) {
    body.set("customer", options.customerId);
  } else if (options.customerEmail) {
    body.set("customer_email", options.customerEmail);
  }

  // Metadata (Stripe permite hasta 50 keys, 40 chars key, 500 chars value)
  body.set("metadata[agency_id]", options.agencyId);
  body.set("metadata[type]", options.type);

  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      if (value !== undefined && value !== null) {
        body.set(`metadata[${key}]`, String(value).slice(0, 500));
      }
    }
  }

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Stripe checkout session creation failed: ${error}`);
  }

  const data = await res.json();

  return {
    sessionId: data.id,
    url: data.url,
  };
}

/**
 * Obtiene el detalle de una sesión de checkout (usar en webhook o success callback)
 */
export async function getCheckoutSession(
  stripeSecretKey: string,
  sessionId: string
): Promise<{
  id: string;
  status: string;
  payment_status: string;
  customer: string | null;
  subscription: string | null;
  metadata: Record<string, string>;
  amount_total: number | null;
  currency: string | null;
}> {
  const res = await fetch(`${STRIPE_API}/checkout/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Stripe checkout session retrieval failed: ${error}`);
  }

  return res.json();
}

/**
 * Crea un Payment Intent para un destacado (alternativa a Checkout para inline)
 */
export async function createHighlightPaymentIntent(
  stripeSecretKey: string,
  priceId: string,
  customerId: string,
  agencyId: string,
  listingId: string
): Promise<{ clientSecret: string }> {
  const body = new URLSearchParams({
    amount: (await getPriceAmount(stripeSecretKey, priceId)).toString(),
    currency: "eur",
    customer: customerId,
    "metadata[agency_id]": agencyId,
    "metadata[listing_id]": listingId,
    "metadata[type]": "highlight",
  });

  const res = await fetch(`${STRIPE_API}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Stripe payment intent creation failed: ${error}`);
  }

  const data = await res.json();
  return { clientSecret: data.client_secret };
}

async function getPriceAmount(stripeSecretKey: string, priceId: string): Promise<number> {
  const res = await fetch(`${STRIPE_API}/prices/${priceId}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get price amount for ${priceId}`);
  }

  const data = await res.json();
  return data.unit_amount as number;
}
