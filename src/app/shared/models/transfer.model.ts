import { Store } from "./store.model";
import { Bank } from "./bank.model";
import { User } from "./user.model";

export interface Transfer {
    _id: string;
    id: number;
    account_number: string;
    bank_name: string;
    bank_code: string;
    fullname: string;
    created_at: string;
    source: string;
    currency: string;
    debit_currency: string;
    amount: number;
    subAmount: number;
    transfer_code: string;
    fee: number;
    prevWalletBallance: number;
    status: string;
    reference: string;
    domain: string;
    meta: {
      store: string | Partial<Store>; // Reference to the 'Store' ObjectId
      customer: string| Partial<User>; // Reference to the 'Merchant' ObjectId
      bank: string | Partial<Bank>; // Reference to the 'Bank' ObjectId
      transactionType: string;
    };
    narration: string;
    approver: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    transferSource: string;
    createdAt?: Date | string; // From mongoose timestamps
    updatedAt?: Date | string; // From mongoose timestamps
  }

  