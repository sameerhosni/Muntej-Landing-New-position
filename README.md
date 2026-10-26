# Muntej marketing website

Arabic-first Muntej landing page and lead-capture API. This repository contains the website, API, and shared packages.

## Development

Install with `pnpm install`. Set up a PostgreSQL database and provide `DATABASE_URL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` through your deployment environment (never commit secrets). Apply the database schema with `pnpm --filter @workspace/db run push`. Run the API with `pnpm --filter @workspace/api-server run dev`; run the website with `PORT=25273 BASE_PATH=/ pnpm --filter @workspace/muntej-website run dev`.

## Before a public launch

Configure a production site origin, review and approve the privacy policy, and set a contact WhatsApp number if that link is needed. Repository publication alone does not deploy the website or configure a domain.
