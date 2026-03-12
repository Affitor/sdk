/**
 * @affitor/tracker/pure
 *
 * Pure/deferred entry point — identical API to the default entry point
 * but makes it explicit that the script is only loaded when
 * `loadAffitor()` is called (no side-effect import).
 *
 * @example
 * ```ts
 * import { loadAffitor } from '@affitor/tracker/pure';
 *
 * // Script only loads when this line runs:
 * const affitor = await loadAffitor('123');
 * ```
 */
export { loadAffitor, _resetAffitor } from './loader';
export type {
  AffitorInstance,
  AffitorInitOptions,
  TrackLeadData,
  TrackTestData,
  RedirectToCheckoutParams,
} from './types';
