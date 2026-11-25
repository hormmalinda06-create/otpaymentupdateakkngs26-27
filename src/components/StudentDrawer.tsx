import { CreditCard, Pencil, Phone, Receipt, X } from 'lucide-react';
import type { Payment, Student } from '../types';
import { formatCurrency, formatKhmerMonth, formatPaymentMethod } from '../utils/format';

interface StudentDrawerProps {
  student: Student | null;
  payments: Payment[];
  onClose: () => void;
  onRecordPayment: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onViewReceipt: (payment: Payment) => void;
}

export function StudentDrawer({
  student,
  payments,
  onClose,
  onRecordPayment,
  onEditStudent,
  onViewReceipt,
}: StudentDrawerProps) {
  if (!student) return null;

  const studentPayments = payments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));

  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 flex justify-end no-print" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-white h-full border-l border-slate-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-500">{student.studentCode}</p>
            <h3 className="text-base font-bold text-slate-900 truncate">{student.fullName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic metadata */}
          <div className="space-y-3 pb-5 border-b border-slate-200 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ថ្នាក់រៀន</span>
              <span className="font-medium text-slate-900 text-right">{student.className}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ថ្លៃសិក្សាប្រចាំខែ</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {formatCurrency(student.monthlyFee, student.currency)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ថ្ងៃត្រូវបង់ប្រចាំខែ</span>
              <span className="font-mono tabular-nums text-slate-900">
                ថ្ងៃទី {String(student.dueDay).padStart(2, '0')}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ទូរស័ព្ទអាណាព្យាបាល</span>
              <span className="font-mono tabular-nums text-slate-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {student.parentPhone || 'មិនបានបញ្ចូល'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ស្ថានភាពសិក្សា</span>
              <span
                className={
                  student.status === 'active'
                    ? 'font-medium text-emerald-700'
                    : 'font-medium text-slate-500'
                }
              >
                {student.status === 'active' ? 'កំពុងរៀន' : 'ផ្អាករៀន'}
              </span>
            </div>
            {student.notes && (
              <div className="pt-1">
                <span className="text-xs text-slate-500 block mb-1">កំណត់ចំណាំ</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {student.notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onRecordPayment(student)}
              className="flex-1 py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              <span>កត់ត្រាបង់ប្រាក់</span>
            </button>
            <button
              type="button"
              onClick={() => onEditStudent(student)}
              className="py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Pencil className="w-4 h-4" />
              <span>កែប្រែ</span>
            </button>
          </div>

          {/* Payment History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">ប្រវត្តិការបង់ប្រាក់</h4>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                សរុប {formatCurrency(totalPaid, student.currency)}
              </span>
            </div>

            {studentPayments.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">មិនទាន់មានប្រវត្តិបង់ប្រាក់នៅឡើយទេ</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {studentPayments.map((p) => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {formatKhmerMonth(p.billingMonth)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        <span className="font-mono tabular-nums">{p.paidDate}</span>
                        {' · '}
                        {formatPaymentMethod(p.method)}
                        {' · '}
                        <span className={p.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}>
                          {p.paymentStatus === 'paid' ? 'បង់ពេញ' : 'បង់ខ្លះ'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                        {formatCurrency(p.amountPaid, p.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onViewReceipt(p)}
                        title="មើលវិក្កយបត្រ"
                        className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
