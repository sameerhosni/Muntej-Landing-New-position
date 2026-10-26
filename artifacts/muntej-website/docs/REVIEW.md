# Muntej website review

## Delivered

Arabic `/`, English `/en`, Arabic/English privacy placeholders and `/admin/leads`. All requested public sections appear in order. Existing logo/font/palette are reused. Demo is illustrative, with voice assignment, receipt, time skip, employee buttons, completion and morning brief; pause/replay and reduced-motion final state are included.

Leads persist server-side, with Saudi number validation, timestamp, language and UTM attribution. Admin login, eight-hour opaque sessions, logout, lead table and protected CSV are implemented. Analytics events are stored in the database. No WhatsApp API or real bot conversation is implied by the demo.

## Remaining TODOs before public launch

1. Replace `TODO_WHATSAPP_NUMBER` with the actual contact number in `src/lib/site.ts`. Until then the contact link is intentionally blocked and exposes a TODO message.
2. Confirm the new website's intended public origin and configure `VITE_SITE_ORIGIN` for the build. It currently uses `https://todo-site-origin.invalid`. Canonical, hreflang, sitemap and OG URLs use that placeholder; indexing is intentionally blocked until configured.
3. Approve and replace the temporary privacy policy, including data use, contact details, retention/deletion rights, lead/event handling and applicable legal text. Do not collect production leads under an unreviewed policy.
4. Confirm data protection measures for the actual Muntej product. No unverified encryption/security guarantee is published.
5. Confirm employee notification/consent process.
6. Confirm messaging times/working-hours behavior. The website makes no guaranteed working-hours limitation.
7. Confirm product data hosting/location and subprocessors.
8. Confirm any PDPL/compliance statement with the responsible reviewer.
9. Confirm the final WhatsApp experience (including whether any extra app/setup is needed).
10. Confirm launch date and availability; the source labels WhatsApp coming soon and the website says early access.
11. Confirm pricing. No price is invented.
12. Obtain a separate explicit production-publish approval before any publication, muntej.app deployment, DNS or custom-domain change.

These claims remain TODO-labelled in trust/FAQ/privacy copy. No customer proof is fabricated.

## Verification

- Entire workspace TypeScript check passed.
- Website production build and API build passed.
- API/security tests: 12 passing test entries, covering server persistence in both languages with UTMs, invalid input, same-origin guard, unauthorized reads/CSV, successful test-only admin login, cookie flags, logout revocation, CSV sanitization, analytics event allowlist and submission rate limits. Test fixtures are removed.
- SEO tests: 7 passing, verifying localized built HTML metadata, AR/EN hreflang, 1200×630 OG dimensions, no zoom restriction, admin noindex, indexing protection while origin is a placeholder, six FAQs and three steps.
- Review captures: mobile Arabic and English at 390×844, desktop Arabic at 1440×1000. They are stored under `generated-artifacts/review/`.
- Screenshots verify public rendered layouts, not interactive flows. The signed-in admin table was not visually verified in the screenshot browser; the authenticated API/CSV/session behavior was verified with isolated test credentials. No user secret values were read by the agent.
- No E2E browser test or code-review subagent was run.
- Live reference exposed no separate old routes or redirects; legacy homepage hash links are preserved as aliases. Its `/robots.txt` and `/sitemap.xml` returned the homepage shell, not real files.

## Publishing status

Not published. No DNS/custom-domain settings changed. This is an implementation ready for review, with launch intentionally gated by the TODOs above.
