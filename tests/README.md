# Tests

Run `npm run dev` in one terminal, then:

- `npm run test:static` — checks every `knowledge/resolutions/*.json` (fields used by templates exist, rule IDs have evaluators, unique ids, valid conditions, …). No server needed.
- `npm run test:api` — generates every resolution through `/api/resolutions/*`, checks business rules (validation, quorum, notice period, gating, escaping, Indian number format) and the security hardening (OTP limits, price list, upload limits).

`BASE_URL=http://localhost:3100` is the default. The tests only use validation paths of the credit/payment endpoints, so they never touch the shared Directus instance.
