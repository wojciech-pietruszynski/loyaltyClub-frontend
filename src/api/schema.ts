/**
 * Walidacja kształtu odpowiedzi backendu w czasie działania.
 *
 * Parametr generyczny klienta HTTP (`api.get<Customer[]>`) jest kontraktem
 * wyłącznie kompilacyjnym — znika po transpilacji i nie chroni przed
 * odpowiedzią o innym kształcie. Poniższe predykaty sprawdzają dane na
 * granicy warstwy dostępu do danych, zanim trafią do stanu Reacta.
 */

import type {
  AuditLogEntry,
  Coupon,
  CouponTemplate,
  Customer,
  CustomerTransaction,
  HierarchyPromotion,
  ReportsSummary,
  StorePromotion,
  TechnicalUser,
} from '../types';
import type { PurchaseHistorySeries } from '../types/ui';

/** Rzucany, gdy odpowiedź nie odpowiada zadeklarowanemu typowi. */
export class ResponseShapeError extends Error {
  readonly context: string;

  constructor(context: string) {
    super(`Nieoczekiwany kształt odpowiedzi backendu: ${context}`);
    this.name = 'ResponseShapeError';
    this.context = context;
  }
}

type Guard<T> = (value: unknown) => value is T;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const str = (o: Record<string, unknown>, key: string): boolean => typeof o[key] === 'string';
const num = (o: Record<string, unknown>, key: string): boolean => typeof o[key] === 'number' && Number.isFinite(o[key]);
const bool = (o: Record<string, unknown>, key: string): boolean => typeof o[key] === 'boolean';
const nullableStr = (o: Record<string, unknown>, key: string): boolean => o[key] === null || o[key] === undefined || typeof o[key] === 'string';
const nullableNum = (o: Record<string, unknown>, key: string): boolean => o[key] === null || o[key] === undefined || typeof o[key] === 'number';
const oneOf = (o: Record<string, unknown>, key: string, allowed: readonly string[]): boolean =>
  typeof o[key] === 'string' && allowed.includes(o[key] as string);

export const isCustomer = (value: unknown): value is Customer =>
  isRecord(value)
  && num(value, 'id')
  && str(value, 'firstName')
  && str(value, 'lastName')
  && str(value, 'email')
  && str(value, 'customerNumber')
  && str(value, 'phoneNumber')
  && str(value, 'country')
  && num(value, 'loyaltyPoints')
  && nullableStr(value, 'loyaltyTierCode')
  && nullableStr(value, 'referralCode');

export const isCoupon = (value: unknown): value is Coupon =>
  isRecord(value)
  && num(value, 'id')
  && str(value, 'couponCode')
  && num(value, 'customerId')
  && str(value, 'customerName')
  && str(value, 'country')
  && num(value, 'couponValue')
  && num(value, 'minimumPurchaseValue')
  && oneOf(value, 'reason', ['POINTS_EXCHANGE', 'COMPLAINT'])
  && oneOf(value, 'status', ['ACTIVE', 'USED', 'EXPIRED'])
  && str(value, 'issuedAt')
  && str(value, 'expiresAt');

export const isCouponTemplate = (value: unknown): value is CouponTemplate =>
  isRecord(value)
  && num(value, 'id')
  && num(value, 'couponValue')
  && num(value, 'minimumPurchaseValue')
  && num(value, 'requiredPoints')
  && str(value, 'country')
  && num(value, 'validityDays')
  && str(value, 'couponPrefix');

export const isCustomerTransaction = (value: unknown): value is CustomerTransaction =>
  isRecord(value)
  && num(value, 'id')
  && num(value, 'points')
  && str(value, 'description')
  && str(value, 'timestamp')
  && nullableStr(value, 'availableFrom');

export const isTechnicalUser = (value: unknown): value is TechnicalUser =>
  isRecord(value)
  && num(value, 'id')
  && str(value, 'username')
  && nullableStr(value, 'passwordPreview')
  && str(value, 'country')
  && bool(value, 'enabled');

export const isStorePromotion = (value: unknown): value is StorePromotion =>
  isRecord(value)
  && num(value, 'id')
  && str(value, 'name')
  && str(value, 'country')
  && num(value, 'pointsPerCurrency')
  && str(value, 'startsAt')
  && nullableStr(value, 'endsAt')
  && bool(value, 'enabled');

export const isHierarchyPromotion = (value: unknown): value is HierarchyPromotion =>
  isRecord(value)
  && num(value, 'id')
  && str(value, 'name')
  && str(value, 'country')
  && nullableStr(value, 'hierarchy')
  && nullableStr(value, 'productClass')
  && nullableStr(value, 'subclass')
  && oneOf(value, 'type', ['MULTIPLIER', 'EXCLUSION'])
  && nullableNum(value, 'multiplier')
  && str(value, 'startsAt')
  && nullableStr(value, 'endsAt')
  && bool(value, 'enabled');

export const isReportsSummary = (value: unknown): value is ReportsSummary =>
  isRecord(value)
  && nullableStr(value, 'scope')
  && num(value, 'customerCount')
  && num(value, 'totalLoyaltyPoints')
  && num(value, 'transactionsLast30Days');

export const isAuditLogEntry = (value: unknown): value is AuditLogEntry =>
  isRecord(value)
  && num(value, 'id')
  && str(value, 'timestamp')
  && str(value, 'username')
  && str(value, 'role')
  && str(value, 'action')
  && str(value, 'resourceType')
  && nullableStr(value, 'resourceId');

export const isPurchaseHistorySeries = (value: unknown): value is PurchaseHistorySeries =>
  isRecord(value)
  && Array.isArray(value.points)
  && value.points.every((point) => isRecord(point) && str(point, 'date') && num(point, 'total'))
  && num(value, 'maxTotal');

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Sprawdza pojedynczy obiekt; rzuca `ResponseShapeError`, gdy kształt się nie zgadza. */
export function parseObject<T>(context: string, value: unknown, guard: Guard<T>): T {
  if (!guard(value)) {
    throw new ResponseShapeError(context);
  }
  return value;
}

/** Sprawdza tablicę obiektów; rzuca `ResponseShapeError`, gdy którykolwiek element jest niezgodny. */
export function parseList<T>(context: string, value: unknown, guard: Guard<T>): T[] {
  if (!Array.isArray(value) || !value.every((item): item is T => guard(item))) {
    throw new ResponseShapeError(context);
  }
  return value as T[];
}
