/**
 * Stripe Billing — Subscriptions, Upgrades, Downgrades, Cancelaciones
 * Gestiona el ciclo de vida completo de las suscripciones de agencias
 */

export interface SubscriptionChange {
  fromPlan: string;
  toPlan: string;
  fromPriceId: string;
  toPriceId: string;
}

const STRIPE_API = "https://api.stripe.com/v1";

// ============================================================
// 1. Crear o recuperar Customer
// ============================================================

export async function createCustomer(
  stripeSecretKey: string,
  params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }
): Promise<{ id: string; email: string }> {
  const body = new URLSearchParams();
  body.set("email", params.email);
  if (params.name) body.set("name", params.name);
  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  const res = await fetch(`${STRIPE_API}/customers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe customer creation failed: ${err}`);
  }

  return res.json();
}

export async function getCustomer(
  stripeSecretKey: string,
  customerId: string
): Promise<{ id: string; email: string; name?: string; metadata?: Record<string, string> }> {
  const res = await fetch(`${STRIPE_API}/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe customer retrieval failed: ${err}`);
  }

  return res.json();
}

// ============================================================
// 2. Gestionar Suscripción
// ============================================================

/**
 * Suscribir a un plan por primera vez
 */
export async function createSubscription(
  stripeSecretKey: string,
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>
): Promise<{
  subscriptionId: string;
  status: string;
  currentPeriodEnd: number;
  clientSecret?: string;
}> {
  const body = new URLSearchParams({
    customer: customerId,
    "items[0][price]": priceId,
    payment_behavior: "default_incomplete",
    expand: "latest_invoice.payment_intent",
  });

  if (metadata) {
    for (const [k, v] of Object.entries(metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  const res = await fetch(`${STRIPE_API}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe subscription creation failed: ${err}`);
  }

  const data = await res.json();

  return {
    subscriptionId: data.id,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    clientSecret: data.latest_invoice?.payment_intent?.client_secret ?? undefined,
  };
}

/**
 * Cambiar de plan (upgrade o downgrade con prorrateo)
 * Stripe maneja el prorrateo automáticamente con proration_behavior
 */
export async function changeSubscriptionPlan(
  stripeSecretKey: string,
  subscriptionId: string,
  newPriceId: string,
  options?: { prorationBehavior?: "create_prorations" | "none" | "always_invoice" }
): Promise<{
  subscriptionId: string;
  status: string;
  currentPeriodEnd: number;
  pendingInvoice?: string;
}> {
  // 1. Obtener la suscripción actual para saber qué item cambiar
  const subRes = await fetch(`${STRIPE_API}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });

  if (!subRes.ok) {
    const err = await subRes.text();
    throw new Error(`Stripe subscription retrieval failed: ${err}`);
  }

  const subscription = await subRes.json();
  const itemId = subscription.items?.data?.[0]?.id;

  if (!itemId) {
    throw new Error("No subscription items found");
  }

  // 2. Actualizar al nuevo precio
  const body = new URLSearchParams({
    "items[0][id]": itemId,
    "items[0][price]": newPriceId,
    proration_behavior: options?.prorationBehavior ?? "create_prorations",
  });

  const res = await fetch(`${STRIPE_API}/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe subscription update failed: ${err}`);
  }

  const data = await res.json();

  return {
    subscriptionId: data.id,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    pendingInvoice: data.latest_invoice?.id ?? undefined,
  };
}

/**
 * Cancelar suscripción al final del período actual
 * (cancel_at_period_end = true)
 */
export async function cancelSubscriptionAtPeriodEnd(
  stripeSecretKey: string,
  subscriptionId: string
): Promise<{ subscriptionId: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: number }> {
  const body = new URLSearchParams({
    cancel_at_period_end: "true",
  });

  const res = await fetch(`${STRIPE_API}/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe subscription cancellation failed: ${err}`);
  }

  const data = await res.json();

  return {
    subscriptionId: data.id,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    currentPeriodEnd: data.current_period_end,
  };
}

/**
 * Reactivar una suscripción que fue marcada para cancelar al final del período
 */
export async function reactivateSubscription(
  stripeSecretKey: string,
  subscriptionId: string
): Promise<{ subscriptionId: string; cancelAtPeriodEnd: boolean }> {
  const body = new URLSearchParams({
    cancel_at_period_end: "false",
  });

  const res = await fetch(`${STRIPE_API}/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe subscription reactivation failed: ${err}`);
  }

  const data = await res.json();

  return {
    subscriptionId: data.id,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}

/**
 * Cancelar inmediatamente (con o sin reembolso prorrateado)
 */
export async function cancelSubscriptionImmediately(
  stripeSecretKey: string,
  subscriptionId: string,
  options?: { refundProrated?: boolean }
): Promise<{ subscriptionId: string; status: string }> {
  const refund = options?.refundProrated ?? false;

  const body = new URLSearchParams({
    invoice_now: refund ? "true" : "false",
    prorate: refund ? "true" : "false",
  });

  const res = await fetch(`${STRIPE_API}/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe subscription immediate cancel failed: ${err}`);
  }

  const data = await res.json();

  return {
    subscriptionId: data.id,
    status: data.status,
  };
}

// ============================================================
// 3. Información de Suscripción
// ============================================================

export async function getSubscription(
  stripeSecretKey: string,
  subscriptionId: string
): Promise<{
  id: string;
  status: string;
  currentPeriodEnd: number;
  currentPeriodStart: number;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  planId: string | null;
  customerId: string;
}> {
  const res = await fetch(`${STRIPE_API}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe subscription retrieval failed: ${err}`);
  }

  const data = await res.json();

  return {
    id: data.id,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    currentPeriodStart: data.current_period_start,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    canceledAt: data.canceled_at,
    planId: data.items?.data?.[0]?.price?.id ?? null,
    customerId: data.customer,
  };
}

/**
 * Listar suscripciones activas de un cliente
 */
export async function listCustomerSubscriptions(
  stripeSecretKey: string,
  customerId: string
): Promise<Array<{
  id: string;
  status: string;
  currentPeriodEnd: number;
  planId: string | null;
}>> {
  const res = await fetch(
    `${STRIPE_API}/subscriptions?customer=${customerId}&status=all`,
    { headers: { Authorization: `Bearer ${stripeSecretKey}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe subscription list failed: ${err}`);
  }

  const data = await res.json();

  return (data.data ?? []).map((sub: any) => ({
    id: sub.id,
    status: sub.status,
    currentPeriodEnd: sub.current_period_end,
    planId: sub.items?.data?.[0]?.price?.id ?? null,
  }));
}

// ============================================================
// 4. Facturas
// ============================================================

export async function listInvoices(
  stripeSecretKey: string,
  customerId: string
): Promise<Array<{
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  pdfUrl: string;
}>> {
  const res = await fetch(
    `${STRIPE_API}/invoices?customer=${customerId}&limit=20`,
    { headers: { Authorization: `Bearer ${stripeSecretKey}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe invoice list failed: ${err}`);
  }

  const data = await res.json();

  return (data.data ?? []).map((inv: any) => ({
    id: inv.id,
    number: inv.number,
    amount: inv.amount_due,
    currency: inv.currency,
    status: inv.status,
    created: inv.created,
    pdfUrl: inv.invoice_pdf,
  }));
}
