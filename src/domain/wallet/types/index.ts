import type { WalletTransactionType } from "@prisma/client";

export interface SerializedWallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
  };
}

export interface SerializedWalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdById: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    username: string;
    name: string | null;
  } | null;
}

export interface SerializedWalletWithTransactions extends SerializedWallet {
  transactions: SerializedWalletTransaction[];
}

export interface CreateTransactionInput {
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  note?: string;
  createdById?: string;
}

export interface PaginatedWallets {
  wallets: SerializedWallet[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedTransactions {
  transactions: (SerializedWalletTransaction & {
    wallet: {
      id: string;
      user: {
        id: string;
        username: string;
        email: string | null;
        name: string | null;
      };
    };
  })[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
