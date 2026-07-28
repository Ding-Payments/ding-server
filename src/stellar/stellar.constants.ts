export const STELLAR_HORIZON_SERVER = Symbol('STELLAR_HORIZON_SERVER');
export const STELLAR_RPC_SERVER = Symbol('STELLAR_RPC_SERVER');
export const STELLAR_NETWORK_CONFIG = Symbol('STELLAR_NETWORK_CONFIG');

export const STELLAR_TRANSACTION_TIMEOUT_SECONDS = 180;

export const STELLAR_ERROR = {
  ACCOUNT_NOT_FOUND: 'STELLAR_ACCOUNT_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'STELLAR_INSUFFICIENT_BALANCE',
  TX_FAILED: 'STELLAR_TX_FAILED',
  OP_UNDERFUNDED: 'STELLAR_OP_UNDERFUNDED',
  NETWORK: 'STELLAR_NETWORK_ERROR',
  TIMEOUT: 'STELLAR_TIMEOUT',
} as const;

export interface StellarNetworkConfig {
  network: 'testnet' | 'mainnet';
  horizonUrl: string;
  rpcUrl: string;
  usdcIssuer: string;
  networkPassphrase: string;
}
