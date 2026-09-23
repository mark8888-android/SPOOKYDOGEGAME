export interface SpecialVaultAddress {
  id: string;
  address: string;
  privateKeyWif: string;
  title: string;
  isCustom?: boolean;
  wonByPlayerId: number | null;
  wonAtRound: number | null;
  wonTimestamp: number | null;
  bountyDogeWon: number;
}

export interface Player {
  id: number;
  name: string;
  avatar: string;
  color: string;
  keybind: string;
  keybindAlt: string;
  address: string;
  privateKeyWif: string;
  balanceDoge: number;
  initialDeposit: number;
  shotsFired: number;
  roundsWon: number;
  lastReactionMs: number | null;
  isReady: boolean;
}

export type RoundStatus = 'IDLE' | 'COUNTDOWN' | 'ACTIVE' | 'HIT' | 'TIMEOUT';

export interface TargetRound {
  roundNumber: number;
  targetAddress: string;
  isSpecialVault: boolean;
  specialVaultId: string | null;
  targetAmountDoge: number;
  status: RoundStatus;
  startedAt: number | null;
  expiresAt: number | null;
  winnerPlayerId: number | null;
  winningTimeMs: number | null;
  txid: string | null;
}

export interface CoreNodeConfig {
  host: string;
  port: number;
  rpcuser: string;
  rpcpassword: string;
  useLiveCore: boolean;
  totalMinedStash: number;
  currentBalance: number;
  connected: boolean;
  version: string;
  blocks: number;
  lastSyncTime: number;
}

export interface GameTransaction {
  id: string;
  txid: string;
  timestamp: number;
  roundNumber: number;
  type: 'CORE_GIVEAWAY' | 'VAULT_UNLOCKED' | 'PLAYER_SHOOT' | 'MANUAL_PAYOUT';
  from: string;
  to: string;
  amountDoge: number;
  winnerName?: string;
  specialVaultAddress?: string;
  status: 'CONFIRMED' | 'PENDING_ONLINE';
}
