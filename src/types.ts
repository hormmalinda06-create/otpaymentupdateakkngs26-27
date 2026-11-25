
export type CurrencyCode = 'USD' | 'KHR';
export type BillingCycle = 'monthly' | 'session';
export type StudentStatus = 'active' | 'paused';
export type Gender = 'male' | 'female';
export type PaymentMethod = 'cash' | 'khqr' | 'transfer';
export type PaymentStatus = 'paid' | 'partial';

export const FIELD_LIMITS = {
  ID_MAX: 128,
  NAME_MAX: 120,
  SCHOOL_NAME_MAX: 140,
  EMAIL_MAX: 200,
  SCHEDULE_MAX: 120,
  PHONE_MAX: 40,
  STUDENT_CODE_MAX: 32,
  RECEIPT_NO_MAX: 40,
  STUDENT_NOTES_MAX: 500,
  PAYMENT_NOTE_MAX: 300,
  AMOUNT_MAX: 100000000,
} as const;

export const PATTERNS = {
  ID: /^[a-zA-Z0-9_-]+$/,
  BILLING_MONTH: /^[0-9]{4}-[0-9]{2}$/,
  PAID_DATE: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  schoolName: string;
  defaultCurrency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

export interface ClassGroup {
  id: string;
  ownerId: string;
  name: string;
  schedule: string;
  feeAmount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  ownerId: string;
  studentCode: string;
  fullName: string;
  gender: Gender;
  parentPhone: string;
  classId: string;
  className: string;
  monthlyFee: number;
  currency: CurrencyCode;
  dueDay: number;
  status: StudentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  ownerId: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  billingMonth: string;
  amountPaid: number;
  expectedAmount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidDate: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type AppView = 'overview' | 'students' | 'classes' | 'payments' | 'settings';
