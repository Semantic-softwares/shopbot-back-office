/** A customer payment through Blink, as the server describes it (the QR string only while it is waiting to be scanned). */
export interface BlinkPayment {
  id: string;
  mode: 'qr' | 'push';
  status: 'pending' | 'success' | 'failed' | 'expired' | 'cancelled';
  amount: number;
  currencyCode: string;
  qrString: string | null;
  expiresAt: string;
  statusDescription: string | null;
  transactionId: string | null;
  customerMobileMasked: string | null;
  used: boolean;
}

export interface BlinkPaymentRow extends BlinkPayment {
  createdAt: string;
  orderRef: string | null;
  lateSuccess: boolean;
  /** Paid, but never attached to a sale: for the owner to reconcile. */
  unattached: boolean;
  requestUUID: string;
}

export interface BlinkStatus {
  eligible: boolean;
  enabled: boolean;
}

export interface BlinkSettings {
  eligible: boolean;
  platformConfigured: boolean;
  environment: 'uat' | 'prod';
  enabled: boolean;
  qrConfigured: boolean;
  qrTail: string | null;
  outletMobileNo: string | null;
  emtelOnboardedConfirmed: boolean;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;
}

export interface SaveBlinkSettings {
  merchantQrString?: string;
  outletMobileNo?: string;
  emtelOnboardedConfirmed?: boolean;
  enabled?: boolean;
}

/** What the panel hands the payment dialog once Blink has confirmed the payment. */
export interface BlinkPaid {
  attemptId: string;
  amount: number;
  reference: string;
}

/** Mauritius mobile numbers: 8 digits starting with 5, with or without +230. */
export const normaliseMauritiusMobile = (raw: string): string | null => {
  const digits = String(raw ?? '').replace(/[\s()-]/g, '').replace(/^\+?230/, '');
  return /^5\d{7}$/.test(digits) ? digits : null;
};
