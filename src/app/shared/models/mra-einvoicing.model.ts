/** What a screen needs to decide whether to offer e-invoicing at all (any country). */
export interface FiscalisationOverview {
  supported: boolean;
  country: string | null;
  authority: { code: string; name: string; country: string } | null;
}

export type MraStatus =
  | 'NOT_CONFIGURED'
  | 'SETUP_IN_PROGRESS'
  | 'MRA_REGISTRATION_REQUIRED'
  | 'TEST_CONFIGURATION'
  | 'TESTING'
  | 'TEST_FAILED'
  | 'TEST_PASSED'
  | 'PENDING_ONBOARDING'
  | 'READY_FOR_LIVE'
  | 'LIVE'
  | 'SUSPENDED'
  | 'CONNECTION_ERROR'
  | 'REQUIRES_REAUTHENTICATION';

export interface MraProgressStep {
  key: number;
  label: string;
  state: 'DONE' | 'CURRENT' | 'TODO';
}

export interface MraBusiness {
  legalName: string;
  tradingName: string;
  tan: string;
  brn: string;
  businessAddr: string;
  businessPhone: string;
  businessEmail: string;
  currency: string;
  country: string;
}

/** The owner's own confirmations of what they did on MRA's portal. Shopbot can't check them. */
export interface MraRegistration {
  registeredAsOperator: boolean;
  placesOfBusinessRegistered: boolean;
  transmissionUserCreated: boolean;
}

/** The MRA Transmission User, shared by all of the owner's stores. The password is never returned. */
export interface MraTransmissionUserView {
  configured: boolean;
  username: string;
  passwordSet: boolean;
  authentication: 'UNKNOWN' | 'OK' | 'FAILED';
  lastValidatedAt: string | null;
}

export type MraTestUserKind = 'MERCHANT_STAFF' | 'PROVIDER';

/** This store's own EBS registration. */
export interface MraPlaceOfBusinessView {
  reference: string;
  ebsMraId: string;
  areaCode: string;
  ebsRegistered: boolean;
  testUserKind: MraTestUserKind | null;
}

/** The store owner's view. The Transmission User password, tokens and keys are never part of it. */
export interface MraOwnerView {
  role: 'OWNER';
  supported: true;
  status: MraStatus;
  headline: string;
  environment: 'TEST' | 'LIVE';
  ebsMode: 'SANDBOX' | 'TEST_DRIVE' | 'LIVE';
  problem: string | null;
  progress: MraProgressStep[];
  shopbotEbs: { compliant: boolean; label: string };
  business: MraBusiness;
  registration: MraRegistration;
  transmissionUser: MraTransmissionUserView;
  placeOfBusiness: MraPlaceOfBusinessView;
  connection: {
    transmissionCredentials: 'CONFIGURED' | 'NOT_CONFIGURED';
    authentication: 'UNKNOWN' | 'OK' | 'FAILED';
    ebsRegistration: 'REGISTERED' | 'NOT_REGISTERED';
    tokenExpiresAt: string | null;
  };
  tests: { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED'; passed: number; required: number; resets: number };
  onboarding: { canSubmit: boolean; submittedAt: string | null; canApprove: boolean; approvedAt: string | null };
  live: {
    canActivate: boolean;
    activatedAt: string | null;
    lastSuccessfulTransmissionAt: string | null;
    lastFiscalisedInvoiceAt: string | null;
    suspendedAt: string | null;
    activationPhrase: string;
  };
}

/** Everyone else on the team only learns whether fiscalisation is on. */
export interface MraMemberView {
  role: 'MEMBER';
  fiscalisation: { active: boolean };
}

export type MraView = MraOwnerView | MraMemberView;

export interface MraAuditEntry {
  _id: string;
  action: string;
  actorId?: string;
  fromStatus?: string;
  toStatus?: string;
  createdAt: string;
}
