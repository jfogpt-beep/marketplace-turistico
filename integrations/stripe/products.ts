/**
 * Stripe Products & Prices Definition
 * Se ejecuta una vez para crear los productos/planes en Stripe.
 * Uso: tsx stripe/products.ts (o desde un script de seed)
 */

export interface PlanConfig {
  name: string;
  description: string;
  price_monthly: number; // en céntimos
  currency: string;
  features: string[];
  metadata: Record<string, string>;
}

export interface HighlightConfig {
  name: string;
  description: string;
  price: number; // en céntimos
  duration_days: number;
  currency: string;
}

// Planes de suscripción para agencias
export const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  basic: {
    name: "Básico",
    description: "5 anuncios activos, sin destacados",
    price_monthly: 2900, // 29€
    currency: "eur",
    features: [
      "5 anuncios activos",
      "Perfil de agencia",
      "Bandeja de mensajes",
      "Soporte por email",
    ],
    metadata: {
      plan_id: "basic",
      max_listings: "5",
      max_highlights: "0",
      has_stats: "false",
      has_verified_badge: "false",
    },
  },
  pro: {
    name: "Profesional",
    description: "20 anuncios, 3 destacados, estadísticas",
    price_monthly: 7900, // 79€
    currency: "eur",
    features: [
      "20 anuncios activos",
      "3 destacados incluidos",
      "Estadísticas avanzadas",
      "Exportar leads a CSV",
      "Soporte prioritario",
    ],
    metadata: {
      plan_id: "pro",
      max_listings: "20",
      max_highlights: "3",
      has_stats: "true",
      has_verified_badge: "false",
    },
  },
  agency: {
    name: "Agencia",
    description: "Anuncios ilimitados, posición premium, badge verificado",
    price_monthly: 19900, // 199€
    currency: "eur",
    features: [
      "Anuncios ilimitados",
      "Destacados ilimitados",
      "Posición premium en búsquedas",
      "Badge verificado",
      "Estadísticas avanzadas",
      "Exportar leads a CSV",
      "Soporte dedicado",
    ],
    metadata: {
      plan_id: "agency",
      max_listings: "unlimited",
      max_highlights: "unlimited",
      has_stats: "true",
      has_verified_badge: "true",
    },
  },
};

// Destacados individuales
export const HIGHLIGHT_OPTIONS: Record<string, HighlightConfig> = {
  highlight_7d: {
    name: "Destacado 7 días",
    description: "Tu anuncio aparecerá en la zona destacada durante 7 días",
    price: 900, // 9€
    duration_days: 7,
    currency: "eur",
  },
  highlight_30d: {
    name: "Destacado 30 días",
    description: "Tu anuncio aparecerá en la zona destacada durante 30 días",
    price: 2900, // 29€
    duration_days: 30,
    currency: "eur",
  },
};

/**
 * Crea los productos y precios en Stripe.
 * Devuelve un mapa de plan_id -> { productId, priceId } para guardar en config.
 */
export async function seedStripeProducts(
  stripeSecretKey: string
): Promise<Record<string, { productId: string; priceId: string }>> {
  const results: Record<string, { productId: string; priceId: string }> = {};

  // 1. Crear planes de suscripción
  for (const [planId, config] of Object.entries(SUBSCRIPTION_PLANS)) {
    const productRes = await fetch("https://api.stripe.com/v1/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        name: config.name,
        description: config.description,
        metadata: JSON.stringify(config.metadata),
      }).toString(),
    });

    if (!productRes.ok) {
      const err = await productRes.text();
      throw new Error(`Stripe product creation failed for ${planId}: ${err}`);
    }

    const product = await productRes.json();

    const priceRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        product: product.id,
        unit_amount: config.price_monthly.toString(),
        currency: config.currency,
        "recurring[interval]": "month",
        "recurring[interval_count]": "1",
      }).toString(),
    });

    if (!priceRes.ok) {
      const err = await priceRes.text();
      throw new Error(`Stripe price creation failed for ${planId}: ${err}`);
    }

    const price = await priceRes.json();
    results[planId] = { productId: product.id, priceId: price.id };
  }

  // 2. Crear opciones de destacado (un solo pago)
  for (const [key, config] of Object.entries(HIGHLIGHT_OPTIONS)) {
    const productRes = await fetch("https://api.stripe.com/v1/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        name: config.name,
        description: config.description,
        metadata: JSON.stringify({ duration_days: config.duration_days.toString() }),
      }).toString(),
    });

    if (!productRes.ok) {
      const err = await productRes.text();
      throw new Error(`Stripe product creation failed for ${key}: ${err}`);
    }

    const product = await productRes.json();

    const priceRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        product: product.id,
        unit_amount: config.price.toString(),
        currency: config.currency,
      }).toString(),
    });

    if (!priceRes.ok) {
      const err = await priceRes.text();
      throw new Error(`Stripe price creation failed for ${key}: ${err}`);
    }

    const price = await priceRes.json();
    results[key] = { productId: product.id, priceId: price.id };
  }

  return results;
}
