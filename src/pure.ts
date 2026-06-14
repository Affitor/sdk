/**
 * @affitor/sdk/pure v2
 *
 * Pure/deferred entry point — identical API to the default entry point
 * but makes it explicit that the script is only loaded when
 * `loadAffitor()` is called (no side-effect import).
 *
 * @example
 * ```ts
 * import { loadAffitor } from '@affitor/sdk/pure';
 *
 * // Script only loads when this line runs:
 * const affitor = await loadAffitor('123');
 * await affitor?.signup('customer_123', 'user@example.com');
 * ```
 */
export { loadAffitor, _resetAffitor } from './loader';
export type {
  AffitorInstance,
  AffitorInitOptions,
  TrackSignupData,
  TrackLeadData,
  TrackTestData,
} from './types';
