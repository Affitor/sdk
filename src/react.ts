/**
 * @affitor/sdk/react
 *
 * React hooks and components for the Affitor tracking SDK.
 *
 * @example
 * ```tsx
 * import { AffitorProvider, useAffitor } from '@affitor/sdk/react';
 *
 * // In your app root:
 * <AffitorProvider programId="123">
 *   <App />
 * </AffitorProvider>
 *
 * // In any component:
 * function SignupForm() {
 *   const affitor = useAffitor();
 *
 *   const handleSignup = async (user) => {
 *     await affitor?.signup(user.id, user.email);
 *   };
 * }
 * ```
 */
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { loadAffitor } from './loader';
import type { AffitorEnv } from './loader';
import type { AffitorInstance, AffitorInitOptions } from './types';

// Re-export types for convenience
export type {
  AffitorInstance,
  AffitorInitOptions,
  TrackSignupData,
  TrackLeadData,
  TrackTestData,
} from './types';
export type { AffitorEnv, LoadAffitorOptions } from './loader';

const AffitorContext = createContext<AffitorInstance | null>(null);

export interface AffitorProviderProps {
  programId: string | number;
  env?: AffitorEnv;
  debug?: boolean;
  scriptUrl?: string;
  children: React.ReactNode;
}

/**
 * React context provider that loads the Affitor SDK and makes it
 * available to all child components via `useAffitor()`.
 */
export function AffitorProvider({
  programId,
  env,
  debug,
  scriptUrl,
  children,
}: AffitorProviderProps) {
  const [affitor, setAffitor] = useState<AffitorInstance | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    loadAffitor(programId, { env, debug, scriptUrl })
      .then((instance) => {
        setAffitor(instance);
      })
      .catch((err) => {
        console.error('[Affitor] Failed to load:', err);
      });
  }, [programId, env, debug, scriptUrl]);

  return createElement(AffitorContext.Provider, { value: affitor }, children);
}

/**
 * Hook to access the Affitor tracker instance.
 *
 * Returns `null` while the SDK is loading or in SSR.
 *
 * @example
 * ```ts
 * const affitor = useAffitor();
 * await affitor?.signup(customerId, email);
 * ```
 */
export function useAffitor(): AffitorInstance | null {
  return useContext(AffitorContext);
}

/**
 * Hook that loads Affitor on mount and returns the instance.
 * Use this as a standalone alternative to `AffitorProvider`.
 *
 * @example
 * ```ts
 * const affitor = useLoadAffitor('123', { debug: true });
 * await affitor?.signup(customerId, email);
 * ```
 */
export function useLoadAffitor(
  programId: string | number,
  options: Omit<AffitorInitOptions, 'programId'> & { scriptUrl?: string } = {},
): AffitorInstance | null {
  const [affitor, setAffitor] = useState<AffitorInstance | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    loadAffitor(programId, options)
      .then(setAffitor)
      .catch((err) => {
        console.error('[Affitor] Failed to load:', err);
      });
  }, [programId, options]);

  return affitor;
}
