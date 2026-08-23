/**
 * Stable error codes for POS scan/pay failures. The API returns them next to
 * the (English, log-friendly) message so clients can show a translated
 * message via POS_ERROR_MESSAGE_KEYS. Client-safe — no server-only imports.
 */
export type PosErrorCode =
  | "ORDER_NOT_FOUND"
  | "ORDER_NOT_PENDING"
  | "ORDER_EXPIRED"
  | "ORDER_OTHER_CUSTOMER"
  | "CUSTOMER_NOT_FOUND"
  | "WALLET_NOT_FOUND"
  | "INSUFFICIENT_BALANCE"
  | "NOT_SCANNED"
  | "INVALID_TIP"
  | "METHOD_NOT_ACCEPTED"
  | "TOPUP_NOT_WALLET_PAYABLE"
  | "FISCAL_NOT_CONFIGURED";

export class PosError extends Error {
  constructor(
    public readonly code: PosErrorCode,
    message: string
  ) {
    super(message);
    this.name = "PosError";
  }
}

/** errorCode → key under the profile.walletPay.errors namespace. */
export type PosErrorMessageKey =
  | "orderNotFound"
  | "orderNotPending"
  | "orderExpired"
  | "orderOtherCustomer"
  | "customerNotFound"
  | "walletNotFound"
  | "insufficientBalance"
  | "notScanned"
  | "invalidTip"
  | "methodNotAccepted"
  | "topupNotWalletPayable"
  | "fiscalNotConfigured";

export const POS_ERROR_MESSAGE_KEYS: Record<PosErrorCode, PosErrorMessageKey> = {
  ORDER_NOT_FOUND: "orderNotFound",
  ORDER_NOT_PENDING: "orderNotPending",
  ORDER_EXPIRED: "orderExpired",
  ORDER_OTHER_CUSTOMER: "orderOtherCustomer",
  CUSTOMER_NOT_FOUND: "customerNotFound",
  WALLET_NOT_FOUND: "walletNotFound",
  INSUFFICIENT_BALANCE: "insufficientBalance",
  NOT_SCANNED: "notScanned",
  INVALID_TIP: "invalidTip",
  METHOD_NOT_ACCEPTED: "methodNotAccepted",
  TOPUP_NOT_WALLET_PAYABLE: "topupNotWalletPayable",
  FISCAL_NOT_CONFIGURED: "fiscalNotConfigured",
};

/** Resolves a broadcast/API errorCode to its walletPay.errors key, if known. */
export function posErrorMessageKey(code: unknown): PosErrorMessageKey | null {
  if (typeof code !== "string") return null;
  return POS_ERROR_MESSAGE_KEYS[code as PosErrorCode] ?? null;
}
