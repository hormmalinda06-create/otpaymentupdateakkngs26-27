import React, { useEffect, useState } from 'react';
import { Check, Copy, Printer, X } from 'lucide-react';
import type { ClassInput, PaymentInput, StudentInput } from '../hooks/useLedgerData';
import {
  FIELD_LIMITS,
  type BillingCycle,
  type ClassGroup,
  type CurrencyCode,
  type Gender,
  type Payment,
  type PaymentMethod,
  type Student,
  type StudentStatus,
} from '../types';
import {
  buildParentReceiptText,
  formatCurrency,
  formatKhmerMonth,
  formatPaymentMethod,
  getTodayDateString,
} from '../utils/format';

// --- Modal Shell ---
function ModalShell({
  title,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4 no-print"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidth} bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden`}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// --- Class Form Modal ---
export function ClassFormModal({
  initial,
  defaultCurrency,
  onClose,
  onSubmit,
}: {
  initial?: ClassGroup | null;
  defaultCurrency: CurrencyCode;
  onClose: () => void;
  onSubmit: (input: ClassInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [schedule, setSchedule] = useState(initial?.schedule || '');
  const [feeAmount, setFeeAmount] = useState(
    initial ? String(initial.feeAmount) : defaultCurrency === 'KHR' ? '80000' : '25'
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    initial?.currency || defaultCurrency
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    initial?.billingCycle || 'monthly'
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !schedule.trim()) {
      setError('សូមបំពេញឈ្មោះថ្នាក់រៀន និងម៉ោងសិក្សា។');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        schedule: schedule.trim(),
        feeAmount: Math.max(0, Number(feeAmount) || 0),
        currency,
        billingCycle,
        isActive,
      });
      onClose();
    } catch {
      setError('មិនអាចរក្សាទុកថ្នាក់រៀនបានទេ។');
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={initial ? 'កែប្រែព័ត៌មានថ្នាក់រៀន' : 'បន្ថែមថ្នាក់រៀនក្រៅម៉ោង'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            ឈ្មោះថ្នាក់ / មុខវិជ្ជា *
          </label>
          <input
            type="text"
            required
            maxLength={FIELD_LIMITS.NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ឧ. គណិតវិទ្យា ថ្នាក់ទី១២"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            កាលវិភាគ / ម៉ោងសិក្សា *
          </label>
          <input
            type="text"
            required
            maxLength={FIELD_LIMITS.SCHEDULE_MAX}
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="ឧ. ចន្ទ - សុក្រ · ៥:៣០ - ៦:៣០ ល្ងាច"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              តម្លៃសិក្សា *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              រូបិយប័ណ្ណ
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="USD">ដុល្លារ ($ USD)</option>
              <option value="KHR">រៀល (៛ KHR)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              របៀបគិតថ្លៃ
            </label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="monthly">ប្រចាំខែ</option>
              <option value="session">តាមវគ្គ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ស្ថានភាពថ្នាក់
            </label>
            <select
              value={isActive ? 'active' : 'inactive'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="active">កំពុងបើកបង្រៀន</option>
              <option value="inactive">បិទបណ្ដោះអាសន្ន</option>
            </select>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            បោះបង់
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// --- Student Form Modal ---
export function StudentFormModal({
  initial,
  classes,
  onClose,
  onSubmit,
}: {
  initial?: Student | null;
  classes: ClassGroup[];
  onClose: () => void;
  onSubmit: (input: StudentInput) => Promise<void>;
}) {
  const defaultClass = initial
    ? classes.find((c) => c.id === initial.classId) || classes[0]
    : classes[0];

  const [fullName, setFullName] = useState(initial?.fullName || '');
  const [gender, setGender] = useState<Gender>(initial?.gender || 'male');
  const [parentPhone, setParentPhone] = useState(initial?.parentPhone || '');
  const [classId, setClassId] = useState(initial?.classId || defaultClass?.id || '');
  const [monthlyFee, setMonthlyFee] = useState(
    initial ? String(initial.monthlyFee) : String(defaultClass?.feeAmount ?? 25)
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    initial?.currency || defaultClass?.currency || 'USD'
  );
  const [dueDay, setDueDay] = useState(String(initial?.dueDay ?? 5));
  const [status, setStatus] = useState<StudentStatus>(initial?.status || 'active');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const chosen = classes.find((c) => c.id === newClassId);
    if (chosen && !initial) {
      setMonthlyFee(String(chosen.feeAmount));
      setCurrency(chosen.currency);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('សូមបញ្ចូលឈ្មោះសិស្ស។');
      return;
    }
    if (!classId) {
      setError('សូមជ្រើសរើសថ្នាក់រៀនជាមុនសិន។');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        gender,
        parentPhone: parentPhone.trim(),
        classId,
        monthlyFee: Math.max(0, Number(monthlyFee) || 0),
        currency,
        dueDay: Math.min(31, Math.max(1, Number(dueDay) || 5)),
        status,
        notes: notes.trim(),
      });
      onClose();
    } catch {
      setError('មិនអាចរក្សាទុកព័ត៌មានសិស្សបានទេ។');
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={initial ? 'កែប្រែព័ត៌មានសិស្ស' : 'ចុះឈ្មោះសិស្សថ្មី'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ឈ្មោះពេញសិស្ស *
            </label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.NAME_MAX}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ឧ. សុខ ចាន់ដារ៉ា"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ភេទ
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="male">ប្រុស</option>
              <option value="female">ស្រី</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ថ្នាក់រៀនក្រៅម៉ោង *
            </label>
            <select
              value={classId}
              onChange={(e) => handleClassChange(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              {classes.length === 0 && <option value="">មិនទាន់មានថ្នាក់រៀន</option>}
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              លេខទូរស័ព្ទអាណាព្យាបាល
            </label>
            <input
              type="text"
              maxLength={FIELD_LIMITS.PHONE_MAX}
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="ឧ. 012 345 678"
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ថ្លៃសិក្សា *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              className="w-full px-3 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              រូបិយប័ណ្ណ
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="USD">USD ($)</option>
              <option value="KHR">KHR (៛)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ថ្ងៃត្រូវបង់ (១-៣១)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full px-3 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ស្ថានភាព
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StudentStatus)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="active">កំពុងរៀន</option>
              <option value="paused">ផ្អាករៀន</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              កំណត់ចំណាំ (បើមាន)
            </label>
            <input
              type="text"
              maxLength={FIELD_LIMITS.STUDENT_NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ឧ. បញ្ចុះតម្លៃបងប្អូន ២០%"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            បោះបង់
          </button>
          <button
            type="submit"
            disabled={saving || classes.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// --- Payment / Top-Up Form Modal ---
export function PaymentFormModal({
  students,
  preselectedStudentId,
  billingMonth,
  existingPartialPayment,
  onClose,
  onRecordPayment,
  onTopUpPayment,
  onSuccessReceipt,
}: {
  students: Student[];
  preselectedStudentId?: string;
  billingMonth: string;
  existingPartialPayment?: Payment | null;
  onClose: () => void;
  onRecordPayment: (input: PaymentInput) => Promise<Payment>;
  onTopUpPayment: (
    payment: Payment,
    additionalAmount: number,
    method: PaymentMethod,
    paidDate: string,
    note: string
  ) => Promise<void>;
  onSuccessReceipt?: (payment: Payment) => void;
}) {
  const activeStudents = students.filter((s) => s.status === 'active');
  const initialStudent =
    students.find((s) => s.id === (existingPartialPayment?.studentId || preselectedStudentId)) ||
    activeStudents[0] ||
    students[0];

  const [studentId, setStudentId] = useState(initialStudent?.id || '');
  const [month, setMonth] = useState(existingPartialPayment?.billingMonth || billingMonth);

  const selectedStudent = students.find((s) => s.id === studentId);
  const remainingDue = existingPartialPayment
    ? Math.max(0, existingPartialPayment.expectedAmount - existingPartialPayment.amountPaid)
    : selectedStudent?.monthlyFee ?? 0;

  const [amountPaid, setAmountPaid] = useState(String(remainingDue));
  const [method, setMethod] = useState<PaymentMethod>('khqr');
  const [paidDate, setPaidDate] = useState(getTodayDateString());
  const [note, setNote] = useState(existingPartialPayment?.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existingPartialPayment && selectedStudent) {
      setAmountPaid(String(selectedStudent.monthlyFee));
    }
  }, [studentId, existingPartialPayment, selectedStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPaid = Number(amountPaid) || 0;
    if (numericPaid <= 0) {
      setError('ចំនួនទឹកប្រាក់ត្រូវតែធំជាង ០។');
      return;
    }
    if (!selectedStudent) {
      setError('សូមជ្រើសរើសសិស្ស។');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (existingPartialPayment) {
        await onTopUpPayment(
          existingPartialPayment,
          numericPaid,
          method,
          paidDate,
          note.trim()
        );
        onClose();
      } else {
        const created = await onRecordPayment({
          studentId: selectedStudent.id,
          billingMonth: month,
          amountPaid: numericPaid,
          expectedAmount: selectedStudent.monthlyFee,
          method,
          paidDate,
          note: note.trim(),
        });
        onClose();
        onSuccessReceipt?.(created);
      }
    } catch {
      setError('មិនអាចកត់ត្រាការបង់ប្រាក់បានទេ។');
      setSaving(false);
    }
  };

  const currency = existingPartialPayment?.currency || selectedStudent?.currency || 'USD';

  return (
    <ModalShell
      title={
        existingPartialPayment
          ? 'បង់បន្ថែមបង្គ្រប់ប្រាក់ខែ'
          : 'កត់ត្រាការបង់ប្រាក់សិស្ស'
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            ឈ្មោះសិស្ស *
          </label>
          <select
            value={studentId}
            disabled={Boolean(existingPartialPayment)}
            onChange={(e) => setStudentId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          >
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.fullName} — {st.className} ({formatCurrency(st.monthlyFee, st.currency)})
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
            <span>
              {existingPartialPayment
                ? `បានបង់រួច: ${formatCurrency(existingPartialPayment.amountPaid, currency)}`
                : `តម្លៃសិក្សាប្រចាំខែ: ${formatCurrency(selectedStudent.monthlyFee, currency)}`}
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {existingPartialPayment
                ? `នៅខ្វះ: ${formatCurrency(remainingDue, currency)}`
                : `ថ្ងៃត្រូវបង់ទី ${String(selectedStudent.dueDay).padStart(2, '0')}`}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              សម្រាប់ខែ *
            </label>
            <input
              type="month"
              required
              disabled={Boolean(existingPartialPayment)}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ទឹកប្រាក់បង់ ({currency}) *
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              required
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              វិធីសាស្ត្របង់ប្រាក់
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="khqr">ABA / KHQR</option>
              <option value="cash">សាច់ប្រាក់</option>
              <option value="transfer">ផ្ទេរប្រាក់ធនាគារ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ថ្ងៃបង់ប្រាក់ *
            </label>
            <input
              type="date"
              required
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            កំណត់ចំណាំ (បើមាន)
          </label>
          <input
            type="text"
            maxLength={FIELD_LIMITS.PAYMENT_NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ឧ. អាណាព្យាបាលផ្ទេរតាម ABA"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            បោះបង់
          </button>
          <button
            type="submit"
            disabled={saving || students.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {saving ? 'កំពុងកត់ត្រា...' : 'បញ្ជាក់ការបង់ប្រាក់'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// --- Printable Receipt Modal ---
export function ReceiptModal({
  payment,
  schoolName,
  onClose,
}: {
  payment: Payment;
  schoolName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = buildParentReceiptText(payment, schoolName);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const remaining = Math.max(0, payment.expectedAmount - payment.amountPaid);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden print-only-container">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between no-print">
          <h3 className="text-base font-semibold text-slate-900">វិក្កយបត្របង់ប្រាក់</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <p className="text-base font-bold text-slate-900">{schoolName}</p>
            <p className="text-xs text-slate-500 mt-1">
              វិក្កយបត្របង់ថ្លៃសិក្សា · <span className="font-mono">{payment.receiptNo}</span>
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ឈ្មោះសិស្ស</span>
              <span className="font-semibold text-slate-900 text-right">{payment.studentName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ថ្នាក់រៀន</span>
              <span className="text-slate-900 text-right">{payment.className}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">សម្រាប់ខែ</span>
              <span className="text-slate-900 text-right">{formatKhmerMonth(payment.billingMonth)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">វិធីសាស្ត្របង់</span>
              <span className="text-slate-900 text-right">{formatPaymentMethod(payment.method)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ថ្ងៃបង់ប្រាក់</span>
              <span className="font-mono tabular-nums text-slate-900">{payment.paidDate}</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-slate-600">តម្លៃត្រូវបង់</span>
              <span className="text-sm font-mono tabular-nums text-slate-700">
                {formatCurrency(payment.expectedAmount, payment.currency)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-900">ទឹកប្រាក់បានបង់</span>
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-800">
                {formatCurrency(payment.amountPaid, payment.currency)}
              </span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-amber-700">ទឹកប្រាក់នៅខ្វះ</span>
                <span className="text-sm font-semibold font-mono tabular-nums text-amber-700">
                  {formatCurrency(remaining, payment.currency)}
                </span>
              </div>
            )}
          </div>

          {payment.note && (
            <p className="text-xs text-slate-500">កំណត់ចំណាំ: {payment.note}</p>
          )}

          <p className="text-center text-xs text-slate-500 pt-1">
            សូមអរគុណចំពោះការបង់ប្រាក់!
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>បានចម្លងរួចរាល់</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>ចម្លងផ្ញើអាណាព្យាបាល</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="py-2 px-4 flex items-center justify-center gap-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>បោះពុម្ព</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirmation Modal ---
export function ConfirmDeleteModal({
  title,
  message,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <ModalShell title={title} onClose={onClose} maxWidth="max-w-sm">
      <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          បោះបង់
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
        >
          {deleting ? 'កំពុងលុប...' : 'បញ្ជាក់ការលុប'}
        </button>
      </div>
    </ModalShell>
  );
}
