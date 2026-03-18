import type { AffitorInitOptions, AffitorInstance } from './types';

export type AffitorEnv = 'production' | 'uat' | 'local';

const SCRIPT_URLS: Record<AffitorEnv, string> = {
  production: 'https://api.affitor.com/js/affitor-tracker.js',
  uat: 'https://uat-affitor-cms.vanilla-ott.com/js/affitor-tracker-uat.js',
  local: 'http://localhost:1337/js/affitor-tracker-local.js',
};

export interface LoadAffitorOptions extends Omit<AffitorInitOptions, 'programId'> {
  /** Environment preset: 'production' (default), 'uat', or 'local' */
  env?: AffitorEnv;
  /** Custom script URL (overrides env preset) */
  scriptUrl?: string;
}

let affitorPromise: Promise<AffitorInstance | null> | null = null;

/**
 * Load the Affitor tracker SDK.
 *
 * Returns a Promise that resolves to the `window.affitor` instance once
 * the script has loaded and initialised. Calling `loadAffitor` multiple
 * times returns the same singleton promise.
 *
 * In server (SSR) environments the promise resolves to `null`.
 *
 * @example
 * ```ts
 * // Production
 * const affitor = await loadAffitor('59');
 *
 * // Local development
 * const affitor = await loadAffitor('29', { env: 'local', debug: true });
 *
 * // UAT
 * const affitor = await loadAffitor('29', { env: 'uat' });
 *
 * // Custom URL
 * const affitor = await loadAffitor('29', { scriptUrl: 'https://my-cdn.com/tracker.js' });
 * ```
 */
export function loadAffitor(
  programId: string | number,
  options: LoadAffitorOptions = {},
): Promise<AffitorInstance | null> {
  if (affitorPromise) return affitorPromise;

  affitorPromise = new Promise<AffitorInstance | null>((resolve, reject) => {
    if (typeof window === 'undefined') {
      // SSR — nothing to load
      resolve(null);
      return;
    }

    // Already loaded
    if (window.affitor && window.affitor.loaded) {
      resolve(window.affitor);
      return;
    }

    // Check for existing script
    const existing = document.querySelector('script[data-affitor-program-id]');
    if (existing && window.affitor) {
      resolve(window.affitor);
      return;
    }

    const script = document.createElement('script');
    script.src = options.scriptUrl || SCRIPT_URLS[options.env || 'production'];
    script.async = true;
    script.setAttribute('data-affitor-program-id', String(programId));

    if (options.debug) {
      script.setAttribute('data-affitor-debug', 'true');
    }

    script.onload = () => {
      if (window.affitor) {
        resolve(window.affitor);
      } else {
        reject(new Error('Affitor SDK loaded but window.affitor is not available'));
      }
    };

    script.onerror = () => {
      affitorPromise = null; // allow retry
      reject(new Error('Failed to load Affitor SDK script'));
    };

    document.head.appendChild(script);
  });

  return affitorPromise;
}

/**
 * Reset the singleton so the next `loadAffitor()` call creates a fresh
 * instance. Mainly useful for tests.
 */
export function _resetAffitor(): void {
  affitorPromise = null;
}
