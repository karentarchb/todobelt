export type WalletTxKind = 'earn' | 'spend';

export interface WalletTx {
  id: string;
  kind: WalletTxKind;
  amount: number;
  reason: string;
  /** ISO timestamp */
  at: string;
}

export interface WalletState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  history: WalletTx[];
}
