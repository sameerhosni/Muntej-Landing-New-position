import { ReplitConnectors } from "@replit/connectors-sdk";
import { pool, type EarlyAccessLead } from "@workspace/db";
import { logger } from "./logger";

const recipient = "sales@muntej.app";

export function buildLeadEmail(lead: EarlyAccessLead): string {
  const subject = Buffer.from("طلب جديد من موقع مُنتج | New Muntej request").toString("base64");
  const body = [
    "طلب تواصل جديد من موقع مُنتج / New website request",
    "",
    `الاسم / Name: ${lead.name}`,
    `الشركة / Company: ${lead.company}`,
    `واتساب / WhatsApp: ${lead.whatsapp}`,
    `اللغة / Language: ${lead.language}`,
    `التاريخ / Submitted: ${lead.createdAt.toISOString()}`,
    `UTM source: ${lead.utmSource || "—"}`,
    `UTM medium: ${lead.utmMedium || "—"}`,
    `UTM campaign: ${lead.utmCampaign || "—"}`,
    `Request ID: ${lead.id}`,
  ].join("\n");
  return [
    `To: ${recipient}`,
    `Subject: =?UTF-8?B?${subject}?=`,
    `Message-ID: <muntej-lead-${lead.id}@muntej.app>`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body).toString("base64").match(/.{1,76}/g)!.join("\r\n"),
  ].join("\r\n");
}

type SendEmail = (raw: string) => Promise<string>;
async function gmailSend(raw: string): Promise<string> {
  const response = await new ReplitConnectors().proxy("google-mail", "/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(raw).toString("base64url") }),
  });
  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error("Email provider did not confirm a message ID");
  return result.id;
}

// Durable queue: saving a request never depends on the email provider being up.
// Claim atomically across server instances; never automatically resend an
// ambiguous send (e.g. connection loss after Gmail accepted the message).
export async function deliverPendingLeadEmails(send: SendEmail = gmailSend): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const claimed = await pool.query<{ lead_id: number }>(`
      UPDATE lead_notifications SET status='sending'
      WHERE lead_id=(SELECT lead_id FROM lead_notifications WHERE status='pending'
        ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING lead_id`);
    const job = claimed.rows[0];
    if (!job) return;
    const { rows } = await pool.query(
      `SELECT id,name,company,role,team_size AS "teamSize",whatsapp,language,
       utm_source AS "utmSource",utm_medium AS "utmMedium",utm_campaign AS "utmCampaign",
       created_at AS "createdAt" FROM early_access_leads WHERE id=$1`, [job.lead_id]);
    try {
      const messageId = await send(buildLeadEmail(rows[0] as EarlyAccessLead));
      await pool.query("UPDATE lead_notifications SET status='sent',message_id=$2,sent_at=NOW() WHERE lead_id=$1",
        [job.lead_id, messageId]);
      logger.info({ leadId: job.lead_id }, "New request email accepted by Gmail");
    } catch {
      await pool.query("UPDATE lead_notifications SET status='failed' WHERE lead_id=$1", [job.lead_id]);
      logger.error({ leadId: job.lead_id }, "Request is saved but email delivery needs review; check Gmail before retrying");
    }
  }
}

export function startLeadEmailWorker(): void {
  const run = () => void deliverPendingLeadEmails().catch(() => logger.error("Lead email queue unavailable"));
  run();
  setInterval(run, 30_000).unref();
}
