/**
 * Register management (opt-in per store). Money in these shapes is always WHOLE MINOR UNITS (cents), exactly as the server holds it;
 * only the screens turn it into a displayed amount (see register-money.ts).
 */

export interface RegisterSettings {
  registerManagementEnabled: boolean;
  requireOpeningCashDeclaration: boolean;
  allowManualClosingDeclaration: boolean;
  allowDenominationClosingDeclaration: boolean;
  requireClosingNotesForVariance: boolean;
  requireManagerApprovalForVariance: boolean;
  varianceApprovalThreshold: number | null;
  cashOutApprovalThreshold: number | null;
  allowCashierHandover: boolean;
  allowMultipleCashiersOnSharedRegister: boolean;
  cashMethodNames: string[];
  denominationOverride: Denomination[];
  staleDeviceMinutes: number;
}

export interface Denomination {
  valueMinor: number;
  kind: 'note' | 'coin';
}

export interface CountRow {
  valueMinor: number;
  quantity: number;
}

export interface CountedRow extends CountRow {
  totalMinor: number;
}

export interface Register {
  _id: string;
  storeId: string;
  name: string;
  code: string;
  operatingMode: 'individual' | 'shared';
  acceptsCash: boolean;
  isActive: boolean;
  terminalId?: string;
  liveSession?: { _id: string; status: SessionStatus; openedAt: string; openedBy: string; openingFloatMinor: number } | null;
  activeCashiers?: { _id: string; name: string | null; startedAt: string }[];
}

export type SessionStatus = 'open' | 'closing' | 'closed';
export type ReconciliationStatus = 'open' | 'provisional' | 'late_entries' | 'reconciled';

export interface RegisterSession {
  _id: string;
  storeId: string;
  registerId: string | { _id: string; name: string; code: string; operatingMode?: string };
  status: SessionStatus;
  isLive: boolean;
  openedBy: string | { _id: string; name: string };
  openedAt: string;
  openingFloatMinor: number;
  openingNotes?: string;
  currencyCode?: string;
  exponent: number;
  closedAt?: string;
  closedBy?: string;
  actualCashMinor?: number;
  cashVarianceMinor?: number;
  closingMethod?: 'denomination' | 'manual';
  closingNotes?: string;
  reconciliationStatus: ReconciliationStatus;
  pendingClose?: unknown;
  lateEntries?: unknown[];
  /** The Z-report as stored when the session closed. */
  closingReport?: RegisterReport;
  /** Opened on this device while it had no connection: the server does not know it yet. */
  offline?: boolean;
  /** A close was made on this device and is waiting to be sent: no new sales meanwhile. */
  closingQueued?: boolean;
}

export interface CashierAssignment {
  _id: string;
  sessionId: string;
  cashierId: string | { _id: string; name: string };
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'ended';
  startedBy: 'open' | 'join' | 'handover' | 'switch';
  handoverNotes?: string;
}

/** What the POS reads: the live session the signed-in cashier is on. */
export interface CurrentRegister {
  session: RegisterSession;
  register: Register;
  assignment: CashierAssignment;
}

export interface MethodTotal {
  method: string;
  minor: number;
}

export interface SessionTotals {
  openingFloat: number;
  cashSales: number;
  cashIn: number;
  cashTransferIn: number;
  cashRefunds: number;
  cashOut: number;
  cashDeposits: number;
  cashTransferOut: number;
  expectedCash: number;
  paymentsByMethod: MethodTotal[];
  paymentsTotal: number;
  refundsByMethod: MethodTotal[];
  salesCount: number;
  cashByCashier: { cashierId: string | null; minor: number }[];
  lateNetCash: number;
  lateCount: number;
}

export type MovementType = 'cash_in' | 'cash_out' | 'cash_refund' | 'cash_deposit' | 'cash_transfer_in' | 'cash_transfer_out';

export interface CashMovement {
  _id: string;
  type: MovementType;
  amountMinor: number;
  reason: string;
  performedBy?: string | { _id: string; name: string } | null;
  approvedBy?: string | { _id: string; name: string } | null;
  reversalOf?: string;
  late?: boolean;
  at?: string;
  createdAt?: string;
  /** A refund shown in the history, built from the refund itself: read-only. */
  virtual?: boolean;
}

export interface InterimCount {
  _id: string;
  type: 'handover' | 'spot';
  method: 'denomination' | 'manual';
  countedMinor: number;
  expectedMinorAtTime: number;
  varianceMinor: number;
  countedBy: string | null;
  responsibleCashier: string | null;
  notes?: string;
  at: string;
}

export interface RegisterReport {
  kind: 'X' | 'Z';
  generatedAt: string;
  register: Pick<Register, 'name' | 'code' | 'operatingMode' | 'acceptsCash'>;
  session: Partial<RegisterSession> & { _id: string; openedBy?: unknown; closedBy?: unknown };
  cashiers: { cashierId: string; name: string | null; startedAt: string; endedAt: string | null; status: string; startedBy: string; handoverNotes?: string }[];
  totals: SessionTotals;
  movements: CashMovement[];
  interimCounts: InterimCount[];
  store?: { name?: string; currencyCode?: string; exponent?: number };
  expectedCashMinor?: number;
  declared?: { method: 'denomination' | 'manual'; actualCashMinor: number; denominations: CountedRow[] };
  variance?: { minor: number; status: 'balanced' | 'shortage' | 'surplus' };
  notes?: string | null;
  approvals?: { approvedBy: string | null; note: string | null; at: string } | null;
  completeness?: { complete: boolean; closedAnyway?: boolean; pendingDevices: unknown[] };
}

export interface CloseSummary {
  session: RegisterSession;
  totals: SessionTotals;
  /** Unpaid table orders still open. They never block a close; they stay open for whoever settles them. */
  openOrders?: number;
  completeness: { complete: boolean; pendingDevices: { deviceId: string | null; pendingCount: number }[] };
  denominations: Denomination[];
  rules: { allowManual: boolean; allowDenomination: boolean; requireNotesForVariance: boolean; requireApprovalForVariance: boolean; approvalThresholdMinor: number | null };
}

export interface CountRequest {
  method: 'denomination' | 'manual';
  actualCashMinor?: number;
  denominations?: CountRow[];
  notes?: string;
  clientEventId?: string;
}

/** What the POS adds to an order so the server can tie its cash to the right drawer. The server decides what to believe. */
export interface RegisterContextPayload {
  registerId: string;
  sessionId: string;
  deviceId: string;
  clientAt: string;
  offline: boolean;
  /** On a shared terminal: who is switched in (the server proves it from the operator token when there is one). */
  operatorId?: string;
}

export interface TerminalInfo {
  _id: string;
  deviceId: string;
  name: string;
  registerId?: string;
  isActive: boolean;
  lastSeenAt?: string;
}

export interface TerminalStaff {
  id: string;
  name: string;
  hasPin: boolean;
  /** What lets this device check the PIN with no connection (sent only to an enrolled terminal). */
  verifier?: { salt: string; iterations: number; hash: string };
}

/** A movement row on the store-wide list (the register and the people are filled in). */
export interface StoreMovement extends Omit<CashMovement, 'performedBy' | 'approvedBy'> {
  registerId: { _id: string; name: string; code: string } | string;
  sessionId: string;
  performedBy?: { _id: string; name: string } | null;
  approvedBy?: { _id: string; name: string } | null;
  transferId?: string;
}

/** A session row on the sessions list: with who is on it now and what the drawer should hold. */
export interface SessionRow extends Omit<RegisterSession, 'registerId' | 'openedBy'> {
  registerId: { _id: string; name: string; code: string; operatingMode?: string };
  openedBy: { _id: string; name: string } | null;
  activeCashiers: { _id: string; name: string | null }[];
  expectedCashMinor: number | null;
}

export interface StoreRegisterReport {
  from: string;
  to: string;
  currencyCode: string | null;
  sessions: { total: number; open: number; closed: number };
  byRegister: { registerId: string; name: string; code: string; cashMinor: number; salesCount: number; cashRefundsMinor: number; sessions: number }[];
  byCashier: { cashierId: string; name: string; cashMinor: number; salesCount: number }[];
  byMethod: { method: string; minor: number }[];
  discrepancies: { shortages: number; shortageMinor: number; surpluses: number; surplusMinor: number; balanced: number; provisional: number; withLateEntries: number };
  unattributed: { cashMinor: number; count: number };
  late: { cashMinor: number; count: number };
}

export interface SessionReconciliation {
  status: SessionStatus;
  reconciliationStatus: ReconciliationStatus;
  z: { expectedCashMinor: number; actualCashMinor: number | null; varianceMinor: number | null } | null;
  lateEntries: { entryId: string; kind: string; cashMinor: number; eventAt: string; timeSuspect?: boolean }[];
  lateNetCash: number;
  adjusted: { expectedCashMinor: number; varianceMinor: number } | null;
  completeness: { complete: boolean; pendingDevices: { deviceId: string | null; pendingCount: number }[] };
  drift: unknown;
}
