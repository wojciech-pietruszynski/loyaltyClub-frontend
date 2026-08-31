export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  customerNumber: string;
  phoneNumber: string;
  country: string;
  loyaltyPoints: number;
  loyaltyTierCode?: string;
  referralCode?: string | null;
}

export interface Coupon {
  id: number;
  couponCode: string;
  customerId: number;
  customerName: string;
  country: string;
  couponValue: number;
  minimumPurchaseValue: number;
  requiredPoints: number;
  validityDays: number;
  couponPrefix: string;
  reason: 'POINTS_EXCHANGE' | 'COMPLAINT';
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  issuedAt: string;
  expiresAt: string;
}

export interface CouponTemplate {
  id: number;
  couponValue: number;
  minimumPurchaseValue: number;
  requiredPoints: number;
  country: string;
  validityDays: number;
  couponPrefix: string;
}

export interface CustomerTransaction {
  id: number;
  points: number;
  description: string;
  timestamp: string;
  availableFrom: string | null;
}

export interface TechnicalUser {
  id: number;
  username: string;
  passwordPreview: string | null;
  country: string;
  enabled: boolean;
}

export interface StorePromotion {
  id: number;
  name: string;
  country: string;
  pointsPerCurrency: number;
  startsAt: string;
  endsAt: string | null;
  enabled: boolean;
}

export type HierarchyPromotionType = 'MULTIPLIER' | 'EXCLUSION';

export interface HierarchyPromotion {
  id: number;
  name: string;
  country: string;
  hierarchy: string | null;
  productClass: string | null;
  subclass: string | null;
  type: HierarchyPromotionType;
  multiplier: number | null;
  startsAt: string;
  endsAt: string | null;
  enabled: boolean;
}

export interface ReportsSummary {
  scope: string | null;
  customerCount: number;
  totalLoyaltyPoints: number;
  transactionsLast30Days: number;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
}
