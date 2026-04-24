export interface EmailJob {
  type: 'welcome' | 'password_reset' | 'email_verify' | 'listing_contact' | 'payment_success' | 'payment_failed' | 'subscription_canceled' | 'agency_verified' | 'listing_approved' | 'listing_rejected' | 'new_message' | 'report_filed';
  to: string;
  subject: string;
  data: Record<string, unknown>;
}

export async function sendToQueue(queue: Queue<EmailJob>, job: EmailJob): Promise<void> {
  await queue.send(job);
}
