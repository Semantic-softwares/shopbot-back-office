import { Role } from './role.model';
import { Store } from './store.model';

/**
 * One row of the Team settings page — a Membership with `merchant`
 * populated (not just an id) and `isOwner` computed server-side by
 * comparing the merchant against Store.owner/Store.merchant. See
 * MerchantsService.getTeamForStore() on the backend.
 */
export interface TeamMember {
  _id: string; // membership id — use for accept/decline-style membership ops
  merchant: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    photo?: string;
    gender?: string;
  };
  role?: Role;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  isOnDuty: boolean;
  isOwner: boolean;
  inviteState?: 'pending' | 'expired' | null;
  inviteExpiresAt?: string | null;
}

/**
 * Mirrors backend src/schemas/membership.schema.ts — one row per
 * (merchant, store) pair, replacing the old assumption that a merchant
 * belongs to a single store with one global role.
 */
export interface Membership {
  _id: string;
  merchant: string;
  store: Store | string;
  role?: Role | string;
  additionalPermissions: string[];
  deniedPermissions: string[];
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  isOnDuty: boolean;
  joinedAt?: string;
  invitedAt?: string;
  deactivatedAt?: string;
  source: 'migration' | 'invite' | 'store-creation';
  createdAt?: string;
  updatedAt?: string;
}
