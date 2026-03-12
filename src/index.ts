/**
 * @affitor/tracker
 *
 * Affitor affiliate tracking SDK for JavaScript applications.
 *
 * Default entry point — loads the tracker script when `loadAffitor()` is
 * first called (similar to @stripe/stripe-js).
 *
 * @example
 * ```ts
 * import { loadAffitor } from '@affitor/tracker';
 *
 * const affitor = await loadAffitor('123');
 * affitor?.trackLead({ email: 'user@example.com', user_id: 'u_1' });
 * ```
 *
 * For deferred loading (script injected only when you call loadAffitor),
 * use the `/pure` entry point:
 *
 * ```ts
 * import { loadAffitor } from '@affitor/tracker/pure';
 * ```
 */
export { loadAffitor, _resetAffitor } from './loader';
export type { AffitorEnv, LoadAffitorOptions } from './loader';
export type {
  AffitorInstance,
  AffitorInitOptions,
  TrackLeadData,
  TrackTestData,
  RedirectToCheckoutParams,
} from './types';
