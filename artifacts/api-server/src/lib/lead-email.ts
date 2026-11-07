import type { EarlyAccessLead } from "@workspace/db";

export const leadEmailRecipient = "sales@muntej.app";

export function leadEmailContent(lead: EarlyAccessLead) {
  return {
    subject: "طلب جديد من موقع مُنتج | New Muntej request",
    messageId: `<muntej-lead-${lead.id}@muntej.app>`,
    idempotencyKey: `muntej-lead-${lead.id}-${lead.createdAt.getTime()}`,
    text: [
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
    ].join("\n"),
  };
}

export function buildLeadEmail(lead: EarlyAccessLead): string {
  const email = leadEmailContent(lead);
  return [
    `To: ${leadEmailRecipient}`,
    `Subject: =?UTF-8?B?${Buffer.from(email.subject).toString("base64")}?=`,
    `Message-ID: ${email.messageId}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(email.text).toString("base64").match(/.{1,76}/g)!.join("\r\n"),
  ].join("\r\n");
}

// Deliberately contains no provider response body, credentials or lead data.
export class LeadEmailError extends Error {
  constructor(public readonly category: string, public readonly status?: number) {
    super(category);
  }
}

type MailEnvironment = Record<string, string | undefined>;
export type LeadEmailConfiguration =
  | { provider: "gmail" }
  | { provider: "resend"; apiKey: string; from: string };

export function leadEmailConfiguration(env: MailEnvironment): LeadEmailConfiguration {
  // An exported Railway app cannot inherit Replit's managed Gmail credentials.
  const provider = env.EMAIL_PROVIDER?.trim() || (env.RAILWAY_SERVICE_ID ? "resend" : "gmail");
  if (provider === "gmail") return { provider };
  if (provider !== "resend") throw new LeadEmailError("unsupported_email_provider");
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.RESEND_FROM?.trim();
  if (!apiKey || !from) throw new LeadEmailError("resend_configuration_missing");
  if (/[\r\n]/.test(from) || !/^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(from)) {
    throw new LeadEmailError("resend_sender_invalid");
  }
  return { provider: "resend", apiKey, from };
}

export async function sendResendLeadEmail(
  lead: EarlyAccessLead,
  config: Extract<LeadEmailConfiguration, { provider: "resend" }>,
  request: typeof fetch = fetch,
): Promise<string> {
  const email = leadEmailContent(lead);
  let response: Response;
  try {
    response = await request("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": email.idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [leadEmailRecipient],
        subject: email.subject,
        text: email.text,
        headers: { "Message-ID": email.messageId },
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // A timeout may happen after acceptance. Never automatically resend it.
    throw new LeadEmailError("provider_network_or_timeout");
  }
  if (!response.ok) throw new LeadEmailError("provider_rejected", response.status);
  let result: { id?: unknown };
  try {
    result = await response.json() as { id?: unknown };
  } catch {
    throw new LeadEmailError("provider_confirmation_missing");
  }
  if (typeof result.id !== "string" || !result.id) {
    throw new LeadEmailError("provider_confirmation_missing");
  }
  return result.id;
}
