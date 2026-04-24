# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the AP202 SvelteKit application. The following changes were made:

- **`src/hooks.client.ts`** (new) — Initializes PostHog in the browser via the SvelteKit `init` hook. Includes a reverse-proxy `api_host` (`/ingest`) to avoid ad blockers, exception capture enabled, and a `handleError` hook that sends all client-side errors to PostHog automatically.
- **`src/hooks.server.ts`** (new) — Sets up the `/ingest` reverse proxy for PostHog on the server, forwarding requests to `us.i.posthog.com` or `us-assets.i.posthog.com` as appropriate. Also includes a `handleError` hook that captures server-side errors.
- **`src/lib/server/posthog.ts`** (new) — Singleton PostHog Node.js client for server-side event capture.
- **`svelte.config.js`** (modified) — Added `paths.relative: false`, required for session replay to work correctly with SSR.
- **`.env`** (modified) — Added `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST` environment variables.
- **`src/routes/security/login/+page.svelte`** (modified) — Added `posthog.identify()` on successful login; captures `user_signed_in`, `user_sign_in_failed`, and `second_factor_submitted` events.
- **`src/lib/components/app/resident-form-page.svelte`** (modified) — Captures `resident_created`, `resident_updated`, and `resident_deleted` events with relevant properties; captures exceptions on errors.
- **`src/lib/components/app/unit-form-page.svelte`** (modified) — Captures `unit_created`, `unit_private_area_updated`, and `unit_deleted` events; captures exceptions on errors.
- **`src/lib/components/app/conta-a-pagar-form-page.svelte`** (modified) — Captures `conta_a_pagar_created` with category, scope, value, and rateio method; captures exceptions on errors.
- **`src/routes/(private)/g/[code]/contas-a-pagar/+page.svelte`** (modified) — Captures `conta_a_pagar_paid` (with value and category) and `conta_a_pagar_deleted`; captures exceptions on errors.
- **`src/routes/(private)/g/[code]/balancete/+page.svelte`** (modified) — Captures `balancete_created` on successful creation.
- **`src/routes/(private)/g/[code]/balancete/[balanceteId]/+page.svelte`** (modified) — Captures `balancete_closed` and `balancete_reopened` with month context; captures exceptions on errors.

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `user_signed_in` | User successfully completed login | `src/routes/security/login/+page.svelte` |
| `user_sign_in_failed` | Login attempt failed with an error message | `src/routes/security/login/+page.svelte` |
| `second_factor_submitted` | User submitted a second factor verification code | `src/routes/security/login/+page.svelte` |
| `resident_created` | A new resident was successfully created | `src/lib/components/app/resident-form-page.svelte` |
| `resident_updated` | An existing resident's data was updated | `src/lib/components/app/resident-form-page.svelte` |
| `resident_deleted` | A resident was deleted from the condominium | `src/lib/components/app/resident-form-page.svelte` |
| `unit_created` | A new unit was successfully created | `src/lib/components/app/unit-form-page.svelte` |
| `unit_private_area_updated` | The private area of a unit was updated | `src/lib/components/app/unit-form-page.svelte` |
| `unit_deleted` | A unit was deleted from the condominium | `src/lib/components/app/unit-form-page.svelte` |
| `conta_a_pagar_created` | A new bill/expense was created | `src/lib/components/app/conta-a-pagar-form-page.svelte` |
| `conta_a_pagar_paid` | A bill was marked as paid | `src/routes/(private)/g/[code]/contas-a-pagar/+page.svelte` |
| `conta_a_pagar_deleted` | A bill was deleted | `src/routes/(private)/g/[code]/contas-a-pagar/+page.svelte` |
| `balancete_created` | A new monthly balance report was created | `src/routes/(private)/g/[code]/balancete/+page.svelte` |
| `balancete_closed` | A monthly balance report was closed/finalized | `src/routes/(private)/g/[code]/balancete/[balanceteId]/+page.svelte` |
| `balancete_reopened` | A closed monthly balance report was reopened | `src/routes/(private)/g/[code]/balancete/[balanceteId]/+page.svelte` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/395074/dashboard/1504710
- **Login trends** (daily logins vs failures): https://us.posthog.com/project/395074/insights/DchkiJbq
- **Login funnel** (failed → signed in conversion): https://us.posthog.com/project/395074/insights/VhfDoMTL
- **Financial activity** (bills created/paid/deleted weekly): https://us.posthog.com/project/395074/insights/alheSR5o
- **Balancete lifecycle** (created/closed/reopened monthly): https://us.posthog.com/project/395074/insights/fKO47Rn0
- **Condominium management actions** (resident + unit create/delete): https://us.posthog.com/project/395074/insights/RhfGvT0E

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
