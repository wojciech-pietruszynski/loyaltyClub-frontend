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

/**
 * Dane testowe zgodne z kontraktem backendu.
 *
 * Odpowiedzi są teraz sprawdzane w czasie działania (`src/api/schema.ts`),
 * więc atrapy w testach muszą mieć pełny, poprawny kształt — atrapa z samym
 * `{ id: 1 }` udawała kontrakt, którego backend nigdy nie zwraca.
 */

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1,
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@example.com',
    customerNumber: 'C-001',
    phoneNumber: '+48 600 100 200',
    country: 'PL',
    loyaltyPoints: 120,
    loyaltyTierCode: 'SILVER',
    referralCode: 'REF-1',
    ...overrides,
  };
}

export function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 1,
    couponCode: 'KUPPL123',
    customerId: 1,
    customerName: 'Jan Kowalski',
    country: 'PL',
    couponValue: 50,
    minimumPurchaseValue: 200,
    requiredPoints: 100,
    validityDays: 30,
    couponPrefix: 'KUPPL',
    reason: 'POINTS_EXCHANGE',
    status: 'ACTIVE',
    issuedAt: '2026-08-01T10:00:00',
    expiresAt: '2026-09-01T10:00:00',
    ...overrides,
  };
}

export function makeCouponTemplate(overrides: Partial<CouponTemplate> = {}): CouponTemplate {
  return {
    id: 1,
    couponValue: 50,
    minimumPurchaseValue: 200,
    requiredPoints: 100,
    country: 'PL',
    validityDays: 30,
    couponPrefix: 'KUPPL',
    ...overrides,
  };
}

export function makeTransaction(overrides: Partial<CustomerTransaction> = {}): CustomerTransaction {
  return {
    id: 1,
    points: 25,
    description: 'Zakup produktów',
    timestamp: '2026-08-01T10:00:00',
    availableFrom: '2026-08-08T10:00:00',
    ...overrides,
  };
}

export function makeTechnicalUser(overrides: Partial<TechnicalUser> = {}): TechnicalUser {
  return {
    id: 1,
    username: 'tech-pl',
    passwordPreview: 'tajne123',
    country: 'PL',
    enabled: true,
    ...overrides,
  };
}

export function makeStorePromotion(overrides: Partial<StorePromotion> = {}): StorePromotion {
  return {
    id: 1,
    name: 'Podwójne punkty',
    country: 'PL',
    pointsPerCurrency: 2,
    startsAt: '2026-08-01T00:00:00',
    endsAt: null,
    enabled: true,
    ...overrides,
  };
}

export function makeHierarchyPromotion(overrides: Partial<HierarchyPromotion> = {}): HierarchyPromotion {
  return {
    id: 1,
    name: 'Mnożnik AGD',
    country: 'PL',
    hierarchy: '42',
    productClass: null,
    subclass: null,
    type: 'MULTIPLIER',
    multiplier: 1.5,
    startsAt: '2026-08-01T00:00:00',
    endsAt: null,
    enabled: true,
    ...overrides,
  };
}

export function makeReportsSummary(overrides: Partial<ReportsSummary> = {}): ReportsSummary {
  return {
    scope: 'PL',
    customerCount: 12,
    totalLoyaltyPoints: 3400,
    transactionsLast30Days: 87,
    ...overrides,
  };
}

export function makeAuditLogEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 1,
    timestamp: '2026-08-01T10:00:00',
    username: 'admin',
    role: 'ADMIN',
    action: 'CREATE',
    resourceType: 'CUSTOMER',
    resourceId: '1',
    ...overrides,
  };
}
