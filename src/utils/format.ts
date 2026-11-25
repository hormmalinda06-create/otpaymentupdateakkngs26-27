import { FIELD_LIMITS, type CurrencyCode, type Payment, type PaymentMethod } from '../types';

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yStr, mStr] = monthKey.split('-');
  const date = new Date(Number(yStr), Number(mStr) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatKhmerMonth(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const mIdx = Number(mStr) - 1;
  const label = KHMER_MONTHS[mIdx] || mStr;
  return `ខែ${label} ${yStr}`;
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  if (currency === 'KHR') {
    return `${Math.round(amount).toLocaleString('en-US')} ៛`;
  }
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case 'cash':
      return 'សាច់ប្រាក់';
    case 'khqr':
      return 'ABA / KHQR';
    case 'transfer':
      return 'ផ្ទេរប្រាក់';
  }
}

export function generateReceiptNo(billingMonth: string): string {
  const ym = billingMonth.replace('-', '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ts = String(Date.now()).slice(-3);
  return `REC-${ym}-${rand}${ts}`.slice(0, FIELD_LIMITS.RECEIPT_NO_MAX);
}

export function generateStudentCode(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const suffix = String(Date.now()).slice(-2);
  return `STU-${rand}${suffix}`.slice(0, FIELD_LIMITS.STUDENT_CODE_MAX);
}

export function clampText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function buildParentReceiptText(payment: Payment, schoolName: string): string {
  const statusText = payment.paymentStatus === 'paid' ? 'បានបង់ពេញ' : 'បង់ខ្លះ';
  const remaining = Math.max(0, payment.expectedAmount - payment.amountPaid);
  const lines = [
    `វិក្កយបត្របង់ប្រាក់សិក្សា — ${schoolName}`,
    `លេខវិក្កយបត្រ: ${payment.receiptNo}`,
    `ឈ្មោះសិស្ស: ${payment.studentName}`,
    `ថ្នាក់រៀន: ${payment.className}`,
    `សម្រាប់ខែ: ${formatKhmerMonth(payment.billingMonth)}`,
    `ទឹកប្រាក់បានបង់: ${formatCurrency(payment.amountPaid, payment.currency)} (${statusText})`,
  ];
  if (remaining > 0) {
    lines.push(`នៅខ្វះ: ${formatCurrency(remaining, payment.currency)}`);
  }
  lines.push(`វិធីសាស្ត្របង់: ${formatPaymentMethod(payment.method)}`);
  lines.push(`កាលបរិច្ឆេទបង់: ${payment.paidDate}`);
  lines.push(`សូមអរគុណ!`);
  return lines.join('\n');
}

export function exportPaymentsCsv(payments: Payment[], monthKey: string): void {
  const headers = [
    'លេខវិក្កយបត្រ',
    'ឈ្មោះសិស្ស',
    'ថ្នាក់រៀន',
    'ប្រចាំខែ',
    'តម្លៃត្រូវបង់',
    'បានបង់',
    'រូបិយប័ណ្ណ',
    'ស្ថានភាព',
    'វិធីបង់',
    'ថ្ងៃបង់ប្រាក់',
    'កំណត់ចំណាំ',
  ];

  const escapeCell = (val: string | number) => {
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = payments.map((p) => [
    p.receiptNo,
    p.studentName,
    p.className,
    p.billingMonth,
    p.expectedAmount,
    p.amountPaid,
    p.currency,
    p.paymentStatus === 'paid' ? 'បានបង់ពេញ' : 'បង់ខ្លះ',
    formatPaymentMethod(p.method),
    p.paidDate,
    p.note,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tuition-payments-${monthKey}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
