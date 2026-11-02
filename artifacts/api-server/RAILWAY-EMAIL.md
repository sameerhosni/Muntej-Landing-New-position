# Railway request notifications

The public `/assistant/` website runs on Railway, independently of the Replit
preview and database. Replit's managed Gmail connection is not standalone
Railway authentication.

## Configure Resend

In Resend, verify an authorized sending domain (a dedicated mail subdomain is
also possible). Obtain a sending API key restricted to that domain. Do not put
keys in source, chat, GitHub, or documentation.

In Railway's **muntej-assistant → production → api → Variables**, configure:

| Variable | Value |
| --- | --- |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | Enter the API key privately in Railway; seal it if available |
| `RESEND_FROM` | A plain email address on the verified sending domain |

The recipient remains `sales@muntej.app`. `RESEND_FROM` must be verified, not
Resend's restricted test sender. Use a real sender address, not a display name.
Replit preview continues to use managed Gmail unless explicitly configured otherwise.

**Do not apply Railway variable changes or push to its connected `devops/docker` branch
until the user approves the production update.** Either action can deploy.
Domain verification DNS additions also require separate approval.

## Verify after the approved deployment

1. Submit one clearly marked diagnostic request through the public form.
2. Confirm the API returns 201 and the request is in Railway's database.
3. Confirm its `lead_notifications` row becomes `sent` with a provider message ID.
4. Check Resend's delivery status and receipt at `sales@muntej.app`.
   Provider acceptance alone is not proof of inbox delivery.

No credentials, message content or provider response bodies are logged. Safe
failure categories and HTTP status codes are logged for diagnosis.

## Previously failed requests

Old `failed` and interrupted `sending` jobs are not automatically resent.
Review the provider's records first to avoid duplicates, exclude the internal
diagnostic request, and obtain approval before requeueing real failed requests.
No bulk retry or production data changes are part of this code update.

When configuration is missing, pending jobs remain pending instead of being
marked failed. Resend requests have a stable per-request idempotency key
(provider retention is limited; it is not a substitute for reviewing old sends).
Timeouts and ambiguous sends are never automatically retried.
