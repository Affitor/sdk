# @affitor/sdk

Official JavaScript/TypeScript SDK for [Affitor](https://affitor.com) affiliate tracking. A Promise-based wrapper around the Affitor tracker script, inspired by [@stripe/stripe-js](https://github.com/stripe/stripe-js), plus a Node server client for reporting leads and sales from your backend.

## Install

```bash
npm install @affitor/sdk
```

## Entry Points

The SDK provides entry points for different use cases:

| Entry Point | Import | Best For |
|---|---|---|
| `@affitor/sdk` | `import { loadAffitor } from '@affitor/sdk'` | Any JS/TS application |
| `@affitor/sdk/react` | `import { AffitorProvider, useAffitor } from '@affitor/sdk/react'` | React / Next.js apps |
| `@affitor/sdk/server` | `import Affitor from '@affitor/sdk/server'` | Node backends (Bearer-auth tracking) — drop-in for `affitor-node` |

---

## `@affitor/sdk` — Core SDK

### `loadAffitor(programId, options?)`

Loads the Affitor tracker script and returns a Promise that resolves to the tracker instance.

- **Singleton** — calling `loadAffitor` multiple times returns the same Promise
- **SSR-safe** — resolves to `null` on the server
- **Guaranteed** — the instance is always ready when the Promise resolves

```ts
import { loadAffitor } from '@affitor/sdk';

const affitor = await loadAffitor('59');
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `env` | `'production' \| 'local'` | `'production'` | Environment preset (selects the tracker script URL) |
| `debug` | `boolean` | `false` | Enable debug mode (verbose console logs, cookie verification) |
| `scriptUrl` | `string` | — | Custom script URL (overrides `env` preset) |

### Environment Presets

| `env` | Script URL |
|---|---|
| `'production'` | `https://api.affitor.com/js/affitor-tracker.js` |
| `'local'` | `http://localhost:1337/js/affitor-tracker-local.js` |

```ts
// Production (default)
const affitor = await loadAffitor('59');

// Local development with debug
const affitor = await loadAffitor('29', { env: 'local', debug: true });

// Custom URL (overrides env)
const affitor = await loadAffitor('29', { scriptUrl: 'https://my-cdn.com/tracker.js' });
```

### Methods

Once loaded, the `affitor` instance provides these methods:

| Method | Description |
|---|---|
| `signup(customerKey, email)` | Track a signup event. Takes the user's ID and email as positional args. Returns a Promise. |
| `trackLead(data)` | **Deprecated.** Alias for `signup()`. Accepts `{ email, user_id }`. Use `signup()` instead. |
| `trackTest(data?)` | Send a test event to verify tracking is working. |
| `getClickId()` | The partner click id from the cookie, or `null`. |
| `getVisitorId()` | The visitor id from Affitor's cookie, or `null` when there is none yet. Pass it to your checkout as `metadata.affitor_visitor_id` so revenue is tied to its source. With consent mode on, call it after `consent(true)`. |
| `consent(granted)` | With `data-affitor-consent="required"` on the script, nothing is stored or sent until `consent(true)`; `consent(false)` removes Affitor's cookies. |
| `redirectToCheckout(params)` | Redirect the user to the Affitor-powered checkout page. |

### Properties

| Property | Type | Description |
|---|---|---|
| `customerCode` | `string \| null` | The affiliate customer code from cookie |
| `affiliateUrl` | `string \| null` | The affiliate referral URL from cookie |
| `hasAffiliateAttribution` | `boolean` | Whether the current visitor was referred by an affiliate |
| `debugMode` | `boolean` | Whether debug mode is enabled |
| `programId` | `number` | The advertiser program ID |

### Example: Track Signup

```ts
import { loadAffitor } from '@affitor/sdk';

async function handleSignup(email: string, password: string) {
  // 1. Create the user account
  const { data } = await supabase.auth.signUp({ email, password });

  // 2. Track the signup — awaits script load, guaranteed to fire
  if (data.user) {
    const affitor = await loadAffitor('59');
    await affitor?.signup(data.user.id, data.user.email);
  }

  // 3. Navigate to dashboard
  router.push('/dashboard');
}
```

### Example: Redirect to Checkout

```ts
import { loadAffitor } from '@affitor/sdk';

async function handleUpgrade() {
  const affitor = await loadAffitor('59');
  affitor?.redirectToCheckout({
    price: 19.99,
    programId: 59,
  });
}
```

---

## `@affitor/sdk/react` — React Hooks

The React entry point provides two patterns: **Provider + hook** and **standalone hook**.

### Pattern A: `AffitorProvider` + `useAffitor()`

Best when your whole app needs access to the tracker state (e.g. showing referral badges).

```tsx
import { AffitorProvider, useAffitor } from '@affitor/sdk/react';

// 1. Wrap your app (layout.tsx or _app.tsx)
export default function RootLayout({ children }) {
  return (
    <AffitorProvider programId="59">
      {children}
    </AffitorProvider>
  );
}

// 2. Read tracker state in any component
function ReferralBadge() {
  const affitor = useAffitor();

  if (!affitor?.hasAffiliateAttribution) return null;

  return <span>Referred by a partner!</span>;
}
```

#### `AffitorProvider` Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `programId` | `string \| number` | Yes | Your Affitor program ID |
| `debug` | `boolean` | No | Enable debug mode |
| `scriptUrl` | `string` | No | Custom script URL |

#### `useAffitor()`

Returns `AffitorInstance | null`. Returns `null` while the SDK is loading.

> **Important:** `useAffitor()` is best for reading tracker state in the UI (e.g. `hasAffiliateAttribution`, `customerCode`). For critical tracking events like `signup`, use `await loadAffitor()` directly instead — see [Which approach should I use?](#which-approach-should-i-use) below.

### Pattern B: `useLoadAffitor()` (Standalone)

Use this when you don't need a provider — the hook loads the SDK on mount.

```tsx
import { useLoadAffitor } from '@affitor/sdk/react';

function MyComponent() {
  const affitor = useLoadAffitor('59', { debug: true });

  return (
    <div>
      {affitor?.hasAffiliateAttribution && <p>Partner referral detected</p>}
    </div>
  );
}
```

---

## Which approach should I use?

### For tracking events (`signup`, `redirectToCheckout`)

Always use `await loadAffitor()` directly. This guarantees the script is loaded before the event fires. Critical events must never be silently skipped.

```ts
// GOOD — guaranteed to fire
const affitor = await loadAffitor('59');
await affitor?.signup(userId, email);

// BAD — affitor could be null if script still loading
const affitor = useAffitor();
await affitor?.signup(userId, email); // silently skipped if null
```

### For reading tracker state in UI

Use `useAffitor()` or `useLoadAffitor()`. If the value is `null` momentarily while loading, the UI simply doesn't render that part yet. No data is lost.

```tsx
// GOOD — fine for UI, gracefully handles loading state
const affitor = useAffitor();
return affitor?.hasAffiliateAttribution ? <Badge /> : null;
```

### Summary

| Use Case | Approach | Why |
|---|---|---|
| `signup` on registration | `await loadAffitor()` | Must not be lost — awaits script load |
| `redirectToCheckout` | `await loadAffitor()` | Must not be lost — awaits script load |
| Show referral badge in UI | `useAffitor()` | OK to show nothing while loading |
| Display customer code | `useAffitor()` | OK to show nothing while loading |
| Check `hasAffiliateAttribution` for conditional UI | `useAffitor()` | OK to show nothing while loading |

---

## Server (Node)

The `@affitor/sdk/server` entry point **is** the [`affitor-node`](https://www.npmjs.com/package/affitor-node) server SDK — same ergonomic API, now shipped inside `@affitor/sdk`. It's a Node-only client (global `fetch`, no DOM) for reporting conversions from your backend. It authenticates with your **program API key** as a Bearer token, so it must never run in the browser.

Attribution model (Dub-style): **bind the customer at lead time**, then a sale needs only `customerExternalId`.

```ts
import Affitor from '@affitor/sdk/server';          // default import
// import { Affitor } from '@affitor/sdk/server';   // named import — both work

const affitor = new Affitor({ apiKey: process.env.AFFITOR_API_KEY! });

// Bind the customer at lead/signup time
await affitor.trackLead({ customerExternalId: user.id, clickId, email: user.email });

// Report a sale from your payment webhook (Stripe, Polar, Lemon Squeezy, …)
await affitor.trackSale({
  customerExternalId: user.id, // resolves attribution (no clickId needed after lead)
  amount: 4900,                // integer cents, after discounts
  taxCents: 0,                 // tax included in amount, if any (deducted from your money-basis start date)
  invoiceId: invoice.id,       // idempotency key — dedups retries
  currency: 'USD',
});

// Reverse a commission from your refund webhook
await affitor.trackRefund({ invoiceId: invoice.id });
```

### Methods

Every `track*` method returns a `Promise<AffitorResponse<T>>` — `{ ok, status, data, error? }` — and never throws on an HTTP error (only on missing required input).

| Method | Endpoint | Description |
|---|---|---|
| `trackLead(input)` | `POST /api/v1/track/lead` | Bind a customer to their click. Needs `customerExternalId` or `clickId`. |
| `trackSale(input)` | `POST /api/v1/track/sale` | Record a sale + commission for an attributed customer. Needs `amount` (cents) + `invoiceId`. |
| `trackRefund(input)` | `POST /api/v1/track/refund` | Reverse the commission for a prior sale. Needs `invoiceId`. |
| `trackClick(input?)` | `POST /api/v1/track/click` | Mint (or reuse) a click id. Public — no auth. |
| `readiness(opts?)` | `GET /api/v1/programs/me/readiness` | The 5-gate readiness verdict for this key's program. Added by `@affitor/sdk` (not in `affitor-node`). |

### Key input fields (camelCase ergonomic)

| Method | Field | Type | Notes |
|---|---|---|---|
| `trackLead` | `customerExternalId` | `string` | Your own user id — binds the customer. |
| `trackLead` | `clickId` | `string` | Affitor click id. One of `clickId` / `customerExternalId` required. |
| `trackSale` | `customerExternalId` | `string` | Resolves attribution. |
| `trackSale` | `amount` | `number` | Sale amount in **integer cents**. |
| `trackSale` | `invoiceId` | `string` | Idempotency key — dedups retries. |
| `trackSale` | `currency` | `string` | ISO currency (default `USD`). |
| `trackRefund` | `invoiceId` | `string` | The sale's `invoiceId`. |
| `trackRefund` | `refundAmountCents` | `number` | Omit for a full refund. |

### Options & errors

```ts
// Custom API base or fetch (testing, Node < 18)
const affitor = new Affitor({
  apiKey,
  apiUrl: 'http://localhost:1337',
  fetch: myFetch,
});
```

`track*` methods surface HTTP errors on the resolved `AffitorResponse` (`ok: false`, `status`, `error`) — they don't throw:

```ts
const res = await affitor.trackSale({ customerExternalId: 'u_1', amount: 4900, invoiceId: 'inv_1' });
if (!res.ok) {
  console.error(`Affitor ${res.status}: ${res.error}`);
}
```

`readiness()` returns the bare verdict and **throws** an `AffitorApiError` on a non-2xx response, exposing `status`, `code`, `retryAfterSeconds`, and the raw `body`. It parses both error envelope shapes the API returns (`{ error: "..." }` and `{ error: { code, message, retry_after_seconds } }`):

```ts
import Affitor, { AffitorApiError } from '@affitor/sdk/server';

try {
  const verdict = await affitor.readiness();
  if (verdict.integration_verified) console.log('ready to go live');
} catch (err) {
  if (err instanceof AffitorApiError) {
    console.error(`Affitor ${err.status} (${err.code}): ${err.message}`);
  }
}
```

---

## Migrating from affitor-node

**Change the import — that's it.** `@affitor/sdk/server` is `affitor-node`'s
exact API: same options-object constructor, same method names, same camelCase
input fields, same `AffitorResponse`, both default and named export. It's a
drop-in replacement.

```ts
// Before (affitor-node)
import Affitor from 'affitor-node';
const affitor = new Affitor({ apiKey: process.env.AFFITOR_API_KEY! });
await affitor.trackSale({ customerExternalId: user.id, amount: 4900, invoiceId: inv.id });

// After (@affitor/sdk) — only the import changed
import Affitor from '@affitor/sdk/server';
const affitor = new Affitor({ apiKey: process.env.AFFITOR_API_KEY! });
await affitor.trackSale({ customerExternalId: user.id, amount: 4900, invoiceId: inv.id });
```

Both import styles work, matching `affitor-node`:

```ts
import Affitor from '@affitor/sdk/server';       // default
import { Affitor } from '@affitor/sdk/server';   // named
```

The only addition over `affitor-node` is the [`readiness()`](#methods) method
for agent-native onboarding.

---

## Migrating from Script Tag

If you're currently using the `<script>` tag approach:

### Before (script tag)

```html
<script src="https://api.affitor.com/js/affitor-tracker.js"
        data-affitor-program-id="59"></script>

<script>
  // Must check if loaded, use queue fallback, handle timing manually
  if (window.affitor) {
    window.affitor.trackLead({ email, user_id });
  } else {
    window.affitorQueue = window.affitorQueue || [];
    window.affitorQueue.push(['trackLead', { email, user_id }]);
  }
</script>
```

### After (npm SDK)

```ts
import { loadAffitor } from '@affitor/sdk';

// No timing issues — awaits script load automatically
const affitor = await loadAffitor('59');
await affitor?.signup(userId, email);
```

No more:
- Manual `if (window.affitor)` checks
- Queue fallback code (`affitorQueue.push`)
- Race conditions between script load and event firing
- `(window as any)` type casting in TypeScript

---

## API Reference

### `loadAffitor(programId, options?)`

| Parameter | Type | Description |
|---|---|---|
| `programId` | `string \| number` | Your Affitor program ID |
| `options.env` | `'production' \| 'local'` | Environment preset |
| `options.debug` | `boolean` | Enable debug mode |
| `options.scriptUrl` | `string` | Custom script URL (overrides env) |

**Returns:** `Promise<AffitorInstance | null>`

### `AffitorInstance`

| Method / Property | Type | Description |
|---|---|---|
| `signup(customerKey, email)` | `(customerKey: string, email: string) => Promise<void>` | Track a signup event |
| `trackLead(data)` | `(data: TrackLeadData) => void` | **Deprecated.** Alias for `signup()`. |
| `trackTest(data?)` | `(data?: TrackTestData) => void` | Send test event |
| `redirectToCheckout(params)` | `(params: RedirectToCheckoutParams) => void` | Redirect to checkout |
| `customerCode` | `string \| null` | Affiliate customer code |
| `affiliateUrl` | `string \| null` | Affiliate referral URL |
| `hasAffiliateAttribution` | `boolean` | Has affiliate attribution |
| `debugMode` | `boolean` | Debug mode enabled |
| `programId` | `number` | Program ID |

### `TrackLeadData`

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | Yes | User's email |
| `user_id` | `string` | Yes | Your app's user ID (critical for payment attribution) |
| `additional_data` | `Record<string, unknown>` | No | Extra metadata |

### `TrackTestData`

| Field | Type | Required | Description |
|---|---|---|---|
| `step_id` | `string` | No | Step identifier (default: `'pageview'`) |
| `message` | `string` | No | Test message |
| `user_id` | `string` | No | User ID |

### `RedirectToCheckoutParams`

| Field | Type | Required | Description |
|---|---|---|---|
| `price` | `number` | No | Price amount |
| `programId` | `string \| number` | No | Override program ID |

---

## License

MIT
