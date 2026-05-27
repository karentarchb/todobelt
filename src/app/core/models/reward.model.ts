export type RewardKind = 'coffee' | 'icecream' | 'break' | 'walk' | 'treat' | 'screen' | 'custom';

export interface Reward {
  id: string;
  title: string;
  description?: string;
  /** Cost in coins */
  cost: number;
  /** Used to pick the ionicon */
  kind: RewardKind;
  /** Optional accent color token */
  accent?: 'rose' | 'blue' | 'green' | 'yellow' | 'purple';
  /** Times the user has claimed this reward */
  claimedCount: number;
  /** ISO timestamp of last claim */
  lastClaimedAt?: string;
}

export interface ClaimRewardResult {
  ok: boolean;
  message: string;
  reward?: Reward;
  remaining?: number;
}
