export interface AffitorInitOptions {
  programId?: string | number;
  debug?: boolean;
}

export interface TrackLeadData {
  email: string;
  user_id: string;
  additional_data?: Record<string, unknown>;
}

export interface TrackTestData {
  step_id?: string;
  message?: string;
  user_id?: string;
}

export interface RedirectToCheckoutParams {
  price?: number;
  programId?: string | number;
  [key: string]: unknown;
}

export interface AffitorInstance {
  init(options: AffitorInitOptions): void;
  trackLead(data: TrackLeadData): void;
  trackTest(data?: TrackTestData): void;
  redirectToCheckout(params: RedirectToCheckoutParams): void;
  customerCode: string | null;
  affiliateUrl: string | null;
  hasAffiliateAttribution: boolean;
  debugMode: boolean;
  programId: number;
  loaded?: boolean;
}

declare global {
  interface Window {
    affitor?: AffitorInstance;
    affitorQueue?: Array<[string, ...unknown[]]>;
  }
}
