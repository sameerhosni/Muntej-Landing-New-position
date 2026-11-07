import { ReplitConnectors } from "@replit/connectors-sdk";
import { pool, type EarlyAccessLead } from "@workspace/db";
import { logger } from "./logger";
import {
  buildLeadEmail, leadEmailConfiguration, LeadEmailError, sendResendLeadEmail,
} from "./lead-email";

export { buildLeadEmail } from "./lead-email";

async function gmailSend(raw: string): Promise<string> {
  const response = await new ReplitConnectors().proxy("google-mail", "/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(raw).toString("base64url") }),
  });
  if (!response.ok) throw new LeadEmailError("provider_rejected", response.status);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new LeadEmailError("provider_confirmation_missing");
  return result.id;
}

// Durable queue: saving a request never depends on the email provider being up.
// Claim atomically across server instances; never automatically resend an
// ambiguous send (e.g. connection loss after Gmail accepted the message).
export async function deliverPendingLeadEmails(): Promise<void> {
  // Validate before claiming: absent configuration must not burn queued jobs.
  const config = leadEmailConfiguration(process.env);
  for (let i = 0; i < 10; i++) {
    const claimed = await pool.query<{ lead_id: number }>(`
      UPDATE lead_notifications SET status='sending'
      WHERE lead_id=(SELECT lead_id FROM lead_notifications WHERE status='pending'
        ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING lead_id`);
    const job = claimed.rows[0];
    if (!job) return;
    let messageId: string;
    try {
      const { rows } = await pool.query(
        `SELECT id,name,company,role,team_size AS "teamSize",whatsapp,language,
         utm_source AS "utmSource",utm_medium AS "utmMedium",utm_campaign AS "utmCampaign",
         created_at AS "createdAt" FROM early_access_leads WHERE id=$1`, [job.lead_id]);
      const lead = rows[0] as EarlyAccessLead | undefined;
      if (!lead) throw new LeadEmailError("saved_request_missing");
      messageId = config.provider === "resend"
        ? await sendResendLeadEmail(lead, config)
        : await gmailSend(buildLeadEmail(lead));
    } catch (error) {
      await pool.query("UPDATE lead_notifications SET status='failed' WHERE lead_id=$1", [job.lead_id]);
      logger.error({
        leadId: job.lead_id, provider: config.provider,
        category: error instanceof LeadEmailError ? error.category : "delivery_failed",
        providerStatus: error instanceof LeadEmailError ? error.status : undefined,
      }, "Request saved; email needs review before retrying");
      continue;
    }
    // If persistence fails after provider acceptance, leave 'sending' for review,
    // rather than misclassifying it as safe to resend.
    await pool.query("UPDATE lead_notifications SET status='sent',message_id=$2,sent_at=NOW() WHERE lead_id=$1",
      [job.lead_id, messageId]);
    logger.info({ leadId: job.lead_id, provider: config.provider }, "Request email accepted by provider");
  }
}

export function startLeadEmailWorker(): void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await deliverPendingLeadEmails();
    } catch (error) {
      logger.error({
        category: error instanceof LeadEmailError ? error.category : "queue_unavailable",
      }, "Lead email worker unavailable; pending requests preserved");
    } finally {
      running = false;
    }
  };
  run();
  setInterval(run, 30_000).unref();
}
