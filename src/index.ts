/**
 * @affitor/tracker v2
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
 * await affitor?.signup('customer_123', 'user@example.com');
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
  TrackSignupData,
  TrackLeadData,
  TrackTestData,
} from './types';
