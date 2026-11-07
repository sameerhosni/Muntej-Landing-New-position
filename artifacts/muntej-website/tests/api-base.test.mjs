import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { customFetch, setBaseUrl } from '../../../lib/api-client-react/src/custom-fetch.ts';

test('website initialization and CSV export use the configured mount', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const admin = readFileSync(new URL('../src/pages/admin-leads.tsx', import.meta.url), 'utf8');
  assert.match(app, /setBaseUrl\(import\.meta\.env\.BASE_URL\)/);
  assert.match(admin, /import\.meta\.env\.BASE_URL\}api\/admin\/leads\.csv/);
});

test('API calls preserve the website mount for root and /assistant/', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ ok: true }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    for (const base of ['/', '/assistant/']) {
      setBaseUrl(base);
      for (const path of ['/api/early-access', '/api/events', '/api/admin/leads']) {
        const result = await customFetch(path, { method: 'POST' });
        assert.deepEqual(result, { ok: true });
        assert.equal(calls.at(-1), `${base.replace(/\/$/, '')}${path}`);
      }
    }
  } finally {
    globalThis.fetch = original;
    setBaseUrl(null);
  }
});
