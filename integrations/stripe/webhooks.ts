/**
 * Stripe Webhooks Handler
 * Procesa eventos Stripe y actualiza payments/subscriptions en D1
 * Compatible con Cloudflare Workers (usa fetch nativo)
 */

export interface WebhookPayload {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export interface D1Database {
  // Interface mínima para D1 (Drizzle ORM o raw D1)
  prepare(query: string): { bind(...values: unknown[]): { run(): Promise<{ success: boolean }> } };
  batch<T>(statements: { run(): Promise<T> }[]): Promise<T[]>;
}

// Tipos de eventos que procesamos
export const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.trial_will_end",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
]);

// ============================================================
// 1. Verificar firma del webhook
// ============================================================

/**
 * Verifica la firma HMAC-SHA256 del webhook de Stripe.
 * Requiere que el secret del webhook esté disponible en el entorno.
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): Promise<WebhookPayload> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Parsear firma: t=<timestamp>,v1=<signature>[,v0=<deprecated>]
  const parts = signature.split(",").map((p) => p.trim());
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Part = parts.find((p) => p.startsWith("v1="));

  if (!tPart || !v1Part) {
    throw new Error("Invalid signature format");
  }

  const timestamp = tPart.replace("t=", "");
  const expectedSig = v1Part.replace("v1=", "");

  // Construir payload firmado: timestamp.payload
  const signedPayload = `${timestamp}.${payload}`;
  const signatureData = encoder.encode(signedPayload);

  const computedSig = await crypto.subtle.sign("HMAC", key, signatureData);
  const computedHex = Array.from(new Uint8Array(computedSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparación timing-safe
  if (computedHex.length !== expectedSig.length) {
    throw new Error("Signature mismatch");
  }

  let mismatch = 0;
  for (let i = 0; i < computedHex.length; i++) {
    mismatch |= computedHex.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }

  if (mismatch !== 0) {
    throw new Error("Signature mismatch");
  }

  // Validar timestamp (máx 5 min de antigüedad)
  const now = Math.floor(Date.now() / 1000);
  const eventTime = parseInt(timestamp, 10);
  if (now - eventTime > 300) {
    throw new Error("Webhook timestamp too old");
  }

  return JSON.parse(payload) as WebhookPayload;
}

// ============================================================
// 2. Handler principal de eventos
// ============================================================

export interface WebhookDependencies {
  db: D1Database;               // D1 DB instance
  stripeSecretKey: string;        // Para lookups adicionales si es necesario
}

/**
 * Procesa un evento de Stripe y actualiza la base de datos.
 * Devuelve true si el evento fue procesado correctamente.
 */
export async function handleStripeWebhook(
  event: WebhookPayload,
  deps: WebhookDependencies
): Promise<{ handled: boolean; message: string }> {
  const { type, data } = event;

  if (!RELEVANT_EVENTS.has(type)) {
    return { handled: true, message: `Event ${type} ignored (not relevant)` };
  }

  const object = data.object as Record<string, unknown>;

  try {
    switch (type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = object as any;
        await handleCheckoutCompleted(session, deps.db);
        return { handled: true, message: "Checkout completed processed" };
      }

      case "checkout.session.async_payment_failed": {
        const session = object as any;
        await handleCheckoutFailed(session, deps.db);
        return { handled: true, message: "Checkout failed processed" };
      }

      case "invoice.paid": {
        const invoice = object as any;
        await handleInvoicePaid(invoice, deps.db);
        return { handled: true, message: "Invoice paid processed" };
      }

      case "invoice.payment_failed": {
        const invoice = object as any;
        await handleInvoicePaymentFailed(invoice, deps.db);
        return { handled: true, message: "Invoice payment failed processed" };
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = object as any;
        await handleSubscriptionUpdated(subscription, deps.db);
        return { handled: true, message: "Subscription updated processed" };
      }

      case "customer.subscription.deleted": {
        const subscription = object as any;
        await handleSubscriptionDeleted(subscription, deps.db);
        return { handled: true, message: "Subscription deleted processed" };
      }

      case "customer.subscription.trial_will_end": {
        const subscription = object as any;
        await handleTrialWillEnd(subscription, deps.db);
        return { handled: true, message: "Trial ending processed" };
      }

      case "payment_intent.succeeded": {
        const pi = object as any;
        await handlePaymentIntentSucceeded(pi, deps.db);
        return { handled: true, message: "Payment intent succeeded processed" };
      }

      case "payment_intent.payment_failed": {
        const pi = object as any;
        await handlePaymentIntentFailed(pi, deps.db);
        return { handled: true, message: "Payment intent failed processed" };
      }

      case "charge.refunded": {
        const charge = object as any;
        await handleChargeRefunded(charge, deps.db);
        return { handled: true, message: "Charge refunded processed" };
      }

      case "charge.dispute.created": {
        const dispute = object as any;
        await handleDisputeCreated(dispute, deps.db);
        return { handled: true, message: "Dispute created processed" };
      }

      default:
        return { handled: true, message: `Event ${type} acknowledged but not acted upon` };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { handled: false, message: `Error processing ${type}: ${errorMessage}` };
  }
}

// ============================================================
// 3. Handlers específicos por evento
// ============================================================

async function handleCheckoutCompleted(session: any, db: D1Database) {
  const metadata = session.metadata || {};
  const agencyId = metadata.agency_id;
  const type = metadata.type; // "subscription" | "highlight"

  if (!agencyId) {
    throw new Error("Missing agency_id in checkout metadata");
  }

  // Insertar registro de payment
  const paymentStmt = db
    .prepare(
      `INSERT INTO payments (
        id, agency_id, stripe_customer_id, stripe_payment_intent_id,
        amount, currency, status, type, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      session.id,
      agencyId,
      session.customer || null,
      session.payment_intent || null,
      session.amount_total || 0,
      session.currency || "eur",
      session.payment_status === "paid" ? "paid" : "pending",
      type || "unknown",
      JSON.stringify(metadata),
      new Date().toISOString()
    );

  await paymentStmt.run();

  // Si es suscripción, guardar relación
  if (type === "subscription" && session.subscription) {
    const subStmt = db
      .prepare(
        `INSERT INTO subscriptions (
          id, agency_id, stripe_customer_id, stripe_subscription_id,
          stripe_price_id, status, current_period_start, current_period_end,
          cancel_at_period_end, plan_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        session.subscription,
        agencyId,
        session.customer || null,
        session.subscription,
        null, // price_id se actualiza con subscription.updated
        "active",
        null,
        null,
        false,
        metadata.plan_id || "unknown",
        new Date().toISOString()
      );

    await subStmt.run();
  }

  // Si es destacado, actualizar tabla de highlights
  if (type === "highlight" && metadata.listing_id) {
    const highlightStmt = db
      .prepare(
        `INSERT INTO listing_highlights (
          id, listing_id, agency_id, payment_id, duration_days, starts_at, ends_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        metadata.listing_id,
        agencyId,
        session.id,
        parseInt(metadata.duration_days || "7", 10),
        new Date().toISOString(),
        new Date(Date.now() + parseInt(metadata.duration_days || "7", 10) * 86400000).toISOString(),
        new Date().toISOString()
      );

    await highlightStmt.run();
  }
}

async function handleCheckoutFailed(session: any, db: D1Database) {
  const metadata = session.metadata || {};

  const stmt = db
    .prepare(
      `INSERT INTO payments (
        id, agency_id, stripe_customer_id, amount, currency,
        status, type, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      session.id,
      metadata.agency_id || null,
      session.customer || null,
      session.amount_total || 0,
      session.currency || "eur",
      "failed",
      metadata.type || "unknown",
      JSON.stringify({ ...metadata, failure_message: session.last_payment_error?.message }),
      new Date().toISOString()
    );

  await stmt.run();
}

async function handleInvoicePaid(invoice: any, db: D1Database) {
  // Actualizar subscription con nuevo período
  if (invoice.subscription) {
    const stmt = db
      .prepare(
        `UPDATE subscriptions SET
          status = ?,
          current_period_start = ?,
          current_period_end = ?,
          updated_at = ?
        WHERE stripe_subscription_id = ?`
      )
      .bind(
        "active",
        new Date(invoice.period_start * 1000).toISOString(),
        new Date(invoice.period_end * 1000).toISOString(),
        new Date().toISOString(),
        invoice.subscription
      );

    await stmt.run();
  }

  // Actualizar payment si existe
  if (invoice.payment_intent) {
    const payStmt = db
      .prepare(
        `UPDATE payments SET status = ?, updated_at = ? WHERE stripe_payment_intent_id = ?`
      )
      .bind("paid", new Date().toISOString(), invoice.payment_intent);

    await payStmt.run();
  }
}

async function handleInvoicePaymentFailed(invoice: any, db: D1Database) {
  if (invoice.subscription) {
    const stmt = db
      .prepare(
        `UPDATE subscriptions SET status = ?, updated_at = ? WHERE stripe_subscription_id = ?`
      )
      .bind("past_due", new Date().toISOString(), invoice.subscription);

    await stmt.run();
  }

  // Log del intento fallido para seguimiento
  const logStmt = db
    .prepare(
      `INSERT INTO audit_log (action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      "invoice_payment_failed",
      "subscription",
      invoice.subscription || invoice.id,
      JSON.stringify({
        invoice_id: invoice.id,
        amount: invoice.amount_due,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt,
      }),
      new Date().toISOString()
    );

  await logStmt.run();
}

async function handleSubscriptionUpdated(subscription: any, db: D1Database) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planId = subscription.items?.data?.[0]?.price?.metadata?.plan_id || "unknown";

  const stmt = db
    .prepare(
      `UPDATE subscriptions SET
        status = ?,
        stripe_price_id = ?,
        plan_id = ?,
        current_period_start = ?,
        current_period_end = ?,
        cancel_at_period_end = ?,
        updated_at = ?
      WHERE stripe_subscription_id = ?`
    )
    .bind(
      subscription.status,
      priceId || null,
      planId,
      subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      subscription.cancel_at_period_end ? 1 : 0,
      new Date().toISOString(),
      subscription.id
    );

  await stmt.run();
}

async function handleSubscriptionDeleted(subscription: any, db: D1Database) {
  const stmt = db
    .prepare(
      `UPDATE subscriptions SET
        status = ?,
        canceled_at = ?,
        updated_at = ?
      WHERE stripe_subscription_id = ?`
    )
    .bind(
      "canceled",
      new Date().toISOString(),
      new Date().toISOString(),
      subscription.id
    );

  await stmt.run();

  // Downgrade automático a plan free en la agencia
  const agencyStmt = db
    .prepare(`UPDATE agencies SET plan = ?, updated_at = ? WHERE id = ?`)
    .bind("free", new Date().toISOString(), subscription.metadata?.agency_id || null);

  await agencyStmt.run();
}

async function handleTrialWillEnd(subscription: any, db: D1Database) {
  // Insertar en audit_log para que un job asíncrono envíe recordatorio
  const stmt = db
    .prepare(
      `INSERT INTO audit_log (action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      "trial_will_end",
      "subscription",
      subscription.id,
      JSON.stringify({ trial_end: subscription.trial_end }),
      new Date().toISOString()
    );

  await stmt.run();
}

async function handlePaymentIntentSucceeded(pi: any, db: D1Database) {
  const stmt = db
    .prepare(
      `UPDATE payments SET status = ?, updated_at = ? WHERE stripe_payment_intent_id = ?`
    )
    .bind("paid", new Date().toISOString(), pi.id);

  await stmt.run();
}

async function handlePaymentIntentFailed(pi: any, db: D1Database) {
  const stmt = db
    .prepare(
      `UPDATE payments SET status = ?, updated_at = ?, metadata = ? WHERE stripe_payment_intent_id = ?`
    )
    .bind(
      "failed",
      new Date().toISOString(),
      JSON.stringify({
        last_payment_error: pi.last_payment_error?.message,
        decline_code: pi.last_payment_error?.decline_code,
      }),
      pi.id
    );

  await stmt.run();
}

async function handleChargeRefunded(charge: any, db: D1Database) {
  const stmt = db
    .prepare(
      `UPDATE payments SET status = ?, updated_at = ? WHERE stripe_payment_intent_id = ?`
    )
    .bind("refunded", new Date().toISOString(), charge.payment_intent);

  await stmt.run();
}

async function handleDisputeCreated(dispute: any, db: D1Database) {
  const stmt = db
    .prepare(
      `INSERT INTO audit_log (action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      "charge_dispute_created",
      "payment",
      dispute.charge,
      JSON.stringify({
        dispute_id: dispute.id,
        reason: dispute.reason,
        amount: dispute.amount,
        evidence_due_by: dispute.evidence_details?.due_by,
      }),
      new Date().toISOString()
    );

  await stmt.run();
}
