export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  customerNumber: string;
  phoneNumber: string;
  country: string;
  loyaltyPoints: number;
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
  availableFrom: string;
}

export interface TechnicalUser {
  id: number;
  username: string;
  passwordPreview: string;
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
