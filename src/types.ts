export interface AffitorInitOptions {
  programId?: string | number;
  debug?: boolean;
}

export interface TrackSignupData {
  customer_key: string;
  email: string;
}

export interface TrackLeadData {
  email: string;
  user_id?: string;
  customer_key?: string;
  additional_data?: Record<string, unknown>;
}

export interface TrackTestData {
  step_id?: string;
  message?: string;
  customer_key?: string;
}

export interface AffitorInstance {
  init(options: AffitorInitOptions): void;
  signup(customerKey: string, email: string): Promise<void>;
  /** @deprecated Use signup() instead. Kept for backward compatibility. */
  trackLead(data: TrackLeadData): Promise<void>;
  getClickId(): string | null;
  /**
   * The visitor id from Affitor's first-party cookie, or null when there is none yet. Put it in
   * your checkout metadata as `affitor_visitor_id` so revenue is tied to the source the visitor
   * came from. It reads the cookie only: with consent mode on, call it after `consent(true)`.
   */
  getVisitorId(): string | null;
  /**
   * With `data-affitor-consent="required"` on the script, nothing is stored or sent until
   * `consent(true)`; `consent(false)` removes Affitor's cookies.
   */
  consent(granted: boolean): void;
  getData(): { clickId: string | null; programId: number; hasAttribution: boolean; affiliateUrl: string | null };
  trackTest(data?: TrackTestData): void;
  clickId: string | null;
  affiliateUrl: string | null;
  hasAffiliateAttribution: boolean;
  debugMode: boolean;
  programId: number;
  loaded: boolean;
}

declare global {
  interface Window {
    affitor?: AffitorInstance;
    affitorQueue?: Array<[string, ...unknown[]]>;
  }
}
