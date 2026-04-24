/**
 * Stripe Customer Portal
 * Redirección al portal de gestión de facturación de Stripe
 */

const STRIPE_API = "https://api.stripe.com/v1";

export interface CustomerPortalOptions {
  customerId: string;
  returnUrl: string;
  flowData?: {
    type: "subscription_cancel" | "subscription_update" | "payment_method_update";
    subscriptionId?: string;
    subscriptionUpdate?: {
      subscription: string;
      items: Array<{
        id: string;
        price: string;
        quantity?: number;
      }>;
    };
  };
}

/**
 * Crea una sesión del Customer Portal y devuelve la URL de redirección.
 */
export async function createCustomerPortalSession(
  stripeSecretKey: string,
  options: CustomerPortalOptions
): Promise<{ url: string }> {
  const body = new URLSearchParams({
    customer: options.customerId,
    "return_url": options.returnUrl,
  });

  // Configurar URL de configuración de facturación
  body.set("configuration[default_return_url]", options.returnUrl);

  // Flow data opcional (ej: cancelar o actualizar suscripción directamente)
  if (options.flowData) {
    body.set("flow_data[type]", options.flowData.type);

    if (options.flowData.subscriptionId) {
      body.set("flow_data[cancel_subscription][subscription]", options.flowData.subscriptionId);
    }

    if (options.flowData.subscriptionUpdate) {
      body.set(
        "flow_data[subscription_update][subscription]",
        options.flowData.subscriptionUpdate.subscription
      );
      for (let i = 0; i < options.flowData.subscriptionUpdate.items.length; i++) {
        const item = options.flowData.subscriptionUpdate.items[i];
        body.set(`flow_data[subscription_update][items][${i}][id]`, item.id);
        body.set(`flow_data[subscription_update][items][${i}][price]`, item.price);
        if (item.quantity) {
          body.set(
            `flow_data[subscription_update][items][${i}][quantity]`,
            item.quantity.toString()
          );
        }
      }
    }
  }

  const res = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe Customer Portal session creation failed: ${err}`);
  }

  const data = await res.json();
  return { url: data.url };
}

/**
 * Helper: redirección rápida para cancelar suscripción
 */
export async function getCancelSubscriptionPortalUrl(
  stripeSecretKey: string,
  customerId: string,
  subscriptionId: string,
  returnUrl: string
): Promise<string> {
  const { url } = await createCustomerPortalSession(stripeSecretKey, {
    customerId,
    returnUrl,
    flowData: {
      type: "subscription_cancel",
      subscriptionId,
    },
  });
  return url;
}

/**
 * Helper: redirección rápida para actualizar método de pago
 */
export async function getUpdatePaymentMethodUrl(
  stripeSecretKey: string,
  customerId: string,
  returnUrl: string
): Promise<string> {
  const { url } = await createCustomerPortalSession(stripeSecretKey, {
    customerId,
    returnUrl,
    flowData: {
      type: "payment_method_update",
    },
  });
  return url;
}
