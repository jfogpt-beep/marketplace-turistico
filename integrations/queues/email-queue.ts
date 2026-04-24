/**
 * Cloudflare Queues — Email consumer
 * Procesa cola de emails y envía vía servicio externo (Resend/SendGrid)
 */

export interface EmailJob {
  type: "welcome" | "new_lead" | "listing_approved" | "subscription_renewal" | "admin_report";
  to: string;
  subject: string;
  html?: string;
  templateData?: Record<string, string>;
}

/**
 * Consumer principal para la cola de emails
 * Se configura en wrangler.toml como queue consumer
 */
export async function emailQueueConsumer(
  batch: MessageBatch<EmailJob>,
  env: { RESEND_API_KEY: string }
): Promise<void> {
  for (const message of batch.messages) {
    try {
      await sendEmail(message.body, env.RESEND_API_KEY);
      message.ack();
    } catch (err) {
      console.error("Email failed:", err);
      message.retry();
    }
  }
}

/**
 * Envía un email vía Resend API (HTTP fetch, compatible Workers)
 */
async function sendEmail(job: EmailJob, apiKey: string): Promise<void> {
  const from = "Marketplace Turístico <noreply@marketplace-turistico.com>";

  // Si no hay HTML, generar desde template
  const html = job.html || generateTemplate(job.type, job.templateData || {});

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: job.to,
      subject: job.subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Resend error: ${error}`);
  }
}

function generateTemplate(type: string, data: Record<string, string>): string {
  const templates: Record<string, string> = {
    welcome: `<h1>¡Bienvenido, ${data.name || "Viajero"}!</h1><p>Tu cuenta en Marketplace Turístico está activa.</p>`,
    new_lead: `<h1>¡Nuevo lead!</h1><p>Has recibido un mensaje de ${data.clientName || "un cliente"} para la oferta "${data.listingTitle || ""}".</p>`,
    listing_approved: `<h1>¡Oferta aprobada!</h1><p>Tu oferta "${data.listingTitle || ""}" ha sido aprobada y ya está visible.</p>`,
    subscription_renewal: `<h1>Recordatorio de renovación</h1><p>Tu suscripción vence el ${data.expiryDate || ""}. Renueva para no perder tus beneficios.</p>`,
    admin_report: `<h1>Reporte recibido</h1><p>Se ha reportado la oferta "${data.listingTitle || ""}" por: ${data.reason || ""}</p>`,
  };

  return templates[type] || `<p>${data.message || "Notificación de Marketplace Turístico"}</p>`;
}

/**
 * Encolar un email para envío asíncrono
 */
export async function queueEmail(
  queue: Queue,
  job: EmailJob
): Promise<void> {
  await queue.send(job);
}
