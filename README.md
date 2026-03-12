# @affitor/tracker

Official JavaScript/TypeScript SDK for [Affitor](https://affitor.com) affiliate tracking. A Promise-based wrapper around the Affitor tracker script, inspired by [@stripe/stripe-js](https://github.com/stripe/stripe-js).

## Install

```bash
npm install @affitor/tracker
```

## Entry Points

The SDK provides two entry points for different use cases:

| Entry Point | Import | Best For |
|---|---|---|
| `@affitor/tracker` | `import { loadAffitor } from '@affitor/tracker'` | Any JS/TS application |
| `@affitor/tracker/react` | `import { AffitorProvider, useAffitor } from '@affitor/tracker/react'` | React / Next.js apps |

---

## `@affitor/tracker` — Core SDK

### `loadAffitor(programId, options?)`

Loads the Affitor tracker script and returns a Promise that resolves to the tracker instance.

- **Singleton** — calling `loadAffitor` multiple times returns the same Promise
- **SSR-safe** — resolves to `null` on the server
- **Guaranteed** — the instance is always ready when the Promise resolves

```ts
import { loadAffitor } from '@affitor/tracker';

const affitor = await loadAffitor('59');
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `env` | `'production' \| 'uat' \| 'local'` | `'production'` | Environment preset (selects the tracker script URL) |
| `debug` | `boolean` | `false` | Enable debug mode (verbose console logs, cookie verification) |
| `scriptUrl` | `string` | — | Custom script URL (overrides `env` preset) |

### Environment Presets

| `env` | Script URL |
|---|---|
| `'production'` | `https://api.affitor.com/js/affitor-tracker.js` |
| `'uat'` | `https://uat-affitor-cms.vanilla-ott.com/js/affitor-tracker-uat.js` |
| `'local'` | `http://localhost:1337/js/affitor-tracker-local.js` |

```ts
// Production (default)
const affitor = await loadAffitor('59');

// Local development with debug
const affitor = await loadAffitor('29', { env: 'local', debug: true });

// UAT
const affitor = await loadAffitor('29', { env: 'uat' });

// Custom URL (overrides env)
const affitor = await loadAffitor('29', { scriptUrl: 'https://my-cdn.com/tracker.js' });
```

### Methods

Once loaded, the `affitor` instance provides these methods:

| Method | Description |
|---|---|
| `trackLead(data)` | Track a lead (signup) event. Requires `email` and `user_id`. |
| `trackTest(data?)` | Send a test event to verify tracking is working. |
| `redirectToCheckout(params)` | Redirect the user to the Affitor-powered checkout page. |

### Properties

| Property | Type | Description |
|---|---|---|
| `customerCode` | `string \| null` | The affiliate customer code from cookie |
| `affiliateUrl` | `string \| null` | The affiliate referral URL from cookie |
| `hasAffiliateAttribution` | `boolean` | Whether the current visitor was referred by an affiliate |
| `debugMode` | `boolean` | Whether debug mode is enabled |
| `programId` | `number` | The advertiser program ID |

### Example: Track Lead on Signup

```ts
import { loadAffitor } from '@affitor/tracker';

async function handleSignup(email: string, password: string) {
  // 1. Create the user account
  const { data } = await supabase.auth.signUp({ email, password });

  // 2. Track the lead — awaits script load, guaranteed to fire
  if (data.user) {
    const affitor = await loadAffitor('59');
    affitor?.trackLead({
      email: data.user.email,
      user_id: data.user.id,
    });
  }

  // 3. Navigate to dashboard
  router.push('/dashboard');
}
```

### Example: Redirect to Checkout

```ts
import { loadAffitor } from '@affitor/tracker';

async function handleUpgrade() {
  const affitor = await loadAffitor('59');
  affitor?.redirectToCheckout({
    price: 19.99,
    programId: 59,
  });
}
```

---

## `@affitor/tracker/react` — React Hooks

The React entry point provides two patterns: **Provider + hook** and **standalone hook**.

### Pattern A: `AffitorProvider` + `useAffitor()`

Best when your whole app needs access to the tracker state (e.g. showing referral badges).

```tsx
import { AffitorProvider, useAffitor } from '@affitor/tracker/react';

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

> **Important:** `useAffitor()` is best for reading tracker state in the UI (e.g. `hasAffiliateAttribution`, `customerCode`). For critical tracking events like `trackLead`, use `await loadAffitor()` directly instead — see [Which approach should I use?](#which-approach-should-i-use) below.

### Pattern B: `useLoadAffitor()` (Standalone)

Use this when you don't need a provider — the hook loads the SDK on mount.

```tsx
import { useLoadAffitor } from '@affitor/tracker/react';

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

### For tracking events (`trackLead`, `redirectToCheckout`)

Always use `await loadAffitor()` directly. This guarantees the script is loaded before the event fires. Critical events must never be silently skipped.

```ts
// GOOD — guaranteed to fire
const affitor = await loadAffitor('59');
affitor?.trackLead({ email, user_id });

// BAD — affitor could be null if script still loading
const affitor = useAffitor();
affitor?.trackLead({ email, user_id }); // silently skipped if null
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
| `trackLead` on signup | `await loadAffitor()` | Must not be lost — awaits script load |
| `redirectToCheckout` | `await loadAffitor()` | Must not be lost — awaits script load |
| Show referral badge in UI | `useAffitor()` | OK to show nothing while loading |
| Display customer code | `useAffitor()` | OK to show nothing while loading |
| Check `hasAffiliateAttribution` for conditional UI | `useAffitor()` | OK to show nothing while loading |

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
import { loadAffitor } from '@affitor/tracker';

// No timing issues — awaits script load automatically
const affitor = await loadAffitor('59');
affitor?.trackLead({ email, user_id });
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
| `options.env` | `'production' \| 'uat' \| 'local'` | Environment preset |
| `options.debug` | `boolean` | Enable debug mode |
| `options.scriptUrl` | `string` | Custom script URL (overrides env) |

**Returns:** `Promise<AffitorInstance | null>`

### `AffitorInstance`

| Method / Property | Type | Description |
|---|---|---|
| `trackLead(data)` | `(data: TrackLeadData) => void` | Track a lead event |
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
