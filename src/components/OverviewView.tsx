import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Receipt,
  Search,
  Sparkles,
} from 'lucide-react';
import type { ClassGroup, Payment, Student } from '../types';
import { formatCurrency, formatKhmerMonth, getCurrentMonthKey } from '../utils/format';

interface OverviewViewProps {
  selectedMonth: string;
  classes: ClassGroup[];
  students: Student[];
  payments: Payment[];
  loading: boolean;
  onOpenNewClass: () => void;
  onOpenNewStudent: () => void;
  onRecordPaymentForStudent: (student: Student) => void;
  onTopUpPayment: (payment: Payment) => void;
  onViewReceipt: (payment: Payment) => void;
  onSelectStudent: (student: Student) => void;
  onSeedStarterData: () => Promise<void>;
}

type BillingFilter = 'all' | 'unpaid' | 'partial' | 'paid';

export function OverviewView({
  selectedMonth,
  classes,
  students,
  payments,
  loading,
  onOpenNewClass,
  onOpenNewStudent,
  onRecordPaymentForStudent,
  onTopUpPayment,
  onViewReceipt,
  onSelectStudent,
  onSeedStarterData,
}: OverviewViewProps) {
  const [filter, setFilter] = useState<BillingFilter>('all');
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === 'active'),
    [students]
  );

  const monthPayments = useMemo(
    () => payments.filter((p) => p.billingMonth === selectedMonth),
    [payments, selectedMonth]
  );

  const paymentByStudent = useMemo(() => {
    const map = new Map<string, Payment[]>();
    for (const p of monthPayments) {
      const list = map.get(p.studentId) || [];
      list.push(p);
      map.set(p.studentId, list);
    }
    return map;
  }, [monthPayments]);

  const currentMonthKey = getCurrentMonthKey();
  const todayDay = new Date().getDate();

  const billingRows = useMemo(() => {
    return activeStudents.map((student) => {
      const studentMonthPayments = paymentByStudent.get(student.id) || [];
      const paidTotal = studentMonthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const latestPayment = studentMonthPayments[0] || null;
      const partialPayment =
        studentMonthPayments.find((p) => p.paymentStatus === 'partial') || null;

      let state: 'paid' | 'partial' | 'overdue' | 'unpaid';
      if (paidTotal >= student.monthlyFee && student.monthlyFee > 0) {
        state = 'paid';
      } else if (studentMonthPayments.some((p) => p.paymentStatus === 'paid')) {
        state = 'paid';
      } else if (paidTotal > 0) {
        state = 'partial';
      } else if (
        selectedMonth < currentMonthKey ||
        (selectedMonth === currentMonthKey && todayDay > student.dueDay)
      ) {
        state = 'overdue';
      } else {
        state = 'unpaid';
      }

      return {
        student,
        paidTotal,
        remaining: Math.max(0, student.monthlyFee - paidTotal),
        state,
        latestPayment,
        partialPayment,
      };
    });
  }, [activeStudents, paymentByStudent, selectedMonth, currentMonthKey, todayDay]);

  const stats = useMemo(() => {
    let collectedUsd = 0;
    let collectedKhr = 0;
    let pendingUsd = 0;
    let pendingKhr = 0;

    for (const p of monthPayments) {
      if (p.currency === 'KHR') collectedKhr += p.amountPaid;
      else collectedUsd += p.amountPaid;
    }

    for (const r of billingRows) {
      if (r.remaining > 0) {
        if (r.student.currency === 'KHR') pendingKhr += r.remaining;
        else pendingUsd += r.remaining;
      }
    }

    const paidCount = billingRows.filter((r) => r.state === 'paid').length;
    const unpaidCount = billingRows.filter(
      (r) => r.state === 'unpaid' || r.state === 'overdue'
    ).length;
    const partialCount = billingRows.filter((r) => r.state === 'partial').length;
    const activeClassesCount = classes.filter((c) => c.isActive).length;

    return {
      collectedUsd,
      collectedKhr,
      pendingUsd,
      pendingKhr,
      paidCount,
      unpaidCount,
      partialCount,
      activeClassesCount,
      totalActiveStudents: billingRows.length,
    };
  }, [monthPayments, billingRows, classes]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return billingRows.filter((row) => {
      if (filter === 'paid' && row.state !== 'paid') return false;
      if (filter === 'partial' && row.state !== 'partial') return false;
      if (filter === 'unpaid' && row.state !== 'unpaid' && row.state !== 'overdue')
        return false;
      if (!q) return true;
      return (
        row.student.fullName.toLowerCase().includes(q) ||
        row.student.className.toLowerCase().includes(q) ||
        row.student.studentCode.toLowerCase().includes(q) ||
        row.student.parentPhone.toLowerCase().includes(q)
      );
    });
  }, [billingRows, filter, search]);

  const collectionRate =
    stats.totalActiveStudents > 0
      ? Math.round((stats.paidCount / stats.totalActiveStudents) * 100)
      : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 bg-white border border-slate-200 rounded-xl p-5 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (classes.length === 0 && students.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto mt-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          ចាប់ផ្តើមគ្រប់គ្រងការបង់ប្រាក់សិស្សក្រៅម៉ោង
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto">
          មិនទាន់មានថ្នាក់រៀន ឬបញ្ជីសិស្សនៅឡើយទេ។ សូមបង្កើតថ្នាក់រៀនដំបូងរបស់អ្នក ឬបង្កើតទិន្នន័យគំរូដើម្បីសាកល្បងប្រើប្រាស់ភ្លាមៗ។
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenNewClass}
            className="px-5 py-2.5 flex items-center gap-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>បង្កើតថ្នាក់រៀនដំបូង</span>
          </button>
          <button
            type="button"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              try {
                await onSeedStarterData();
              } finally {
                setSeeding(false);
              }
            }}
            className="px-5 py-2.5 flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>{seeding ? 'កំពុងបង្កើតទិន្នន័យ...' : 'បង្កើតទិន្នន័យគំរូ'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-column KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            ចំណូលប្រមូលបាន ({formatKhmerMonth(selectedMonth)})
          </p>
          <div className="mt-2 space-y-0.5">
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(stats.collectedUsd, 'USD')}
            </p>
            {stats.collectedKhr > 0 && (
              <p className="text-sm font-semibold font-mono tabular-nums text-emerald-800">
                + {formatCurrency(stats.collectedKhr, 'KHR')}
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            ប្រតិបត្តិការសរុប <span className="font-mono tabular-nums">{monthPayments.length}</span> លើក
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">សិស្សបានបង់ប្រាក់ពេញ</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-800">
            {stats.paidCount}
            <span className="text-sm font-normal text-slate-400">
              {' '}
              / {stats.totalActiveStudents} នាក់
            </span>
          </p>
          <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-700 rounded-full transition-all duration-300"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">មិនទាន់បង់ / បង់ខ្លះ</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-red-700">
            {stats.unpaidCount + stats.partialCount}
            <span className="text-sm font-normal text-slate-500"> នាក់</span>
          </p>
          <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            នៅខ្វះ: {formatCurrency(stats.pendingUsd, 'USD')}
            {stats.pendingKhr > 0 ? ` · ${formatCurrency(stats.pendingKhr, 'KHR')}` : ''}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">ថ្នាក់រៀនក្រៅម៉ោងសកម្ម</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.activeClassesCount}
            <span className="text-sm font-normal text-slate-500"> ថ្នាក់</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            សិស្សសរុប <span className="font-mono tabular-nums">{students.length}</span> នាក់
          </p>
        </div>
      </div>

      {/* Monthly Student Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            {(
              [
                ['all', `ទាំងអស់ (${billingRows.length})`],
                ['unpaid', `មិនទាន់បង់ (${stats.unpaidCount})`],
                ['partial', `បង់ខ្លះ (${stats.partialCount})`],
                ['paid', `បានបង់ពេញ (${stats.paidCount})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  filter === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ស្វែងរកឈ្មោះសិស្ស ឬថ្នាក់..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>
            <button
              type="button"
              onClick={onOpenNewStudent}
              className="px-3.5 py-2 flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>បន្ថែមសិស្ស</span>
            </button>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">
              {activeStudents.length === 0
                ? 'មិនទាន់មានសិស្សកំពុងរៀននៅឡើយទេ។'
                : 'មិនមានទិន្នន័យសិស្សត្រូវនឹងតម្រងនេះទេ។'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-6">សិស្ស</th>
                  <th className="py-3 px-4">ថ្នាក់រៀន</th>
                  <th className="py-3 px-4 text-right">ថ្ងៃត្រូវបង់</th>
                  <th className="py-3 px-4 text-right">ថ្លៃសិក្សា</th>
                  <th className="py-3 px-4 text-right">បានបង់</th>
                  <th className="py-3 px-4">ស្ថានភាព</th>
                  <th className="py-3 px-6 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredRows.map((row) => {
                  const { student, paidTotal, remaining, state, latestPayment, partialPayment } = row;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/90 transition-colors"
                    >
                      <td className="py-3 px-6">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student)}
                          className="text-left group cursor-pointer"
                        >
                          <span className="font-medium text-slate-900 group-hover:text-emerald-800 group-hover:underline block">
                            {student.fullName}
                          </span>
                          <span className="text-xs text-slate-500 font-mono tabular-nums">
                            {student.studentCode}
                            {student.parentPhone ? ` · ${student.parentPhone}` : ''}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{student.className}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 text-xs">
                        ទី {String(student.dueDay).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                        {formatCurrency(student.monthlyFee, student.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(paidTotal, student.currency)}
                        </span>
                        {remaining > 0 && paidTotal > 0 && (
                          <span className="block text-xs text-amber-700">
                            ខ្វះ {formatCurrency(remaining, student.currency)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {state === 'paid' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>បានបង់ពេញ</span>
                          </span>
                        )}
                        {state === 'partial' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>បង់ខ្លះ</span>
                          </span>
                        )}
                        {state === 'unpaid' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>មិនទាន់បង់</span>
                          </span>
                        )}
                        {state === 'overdue' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>ហួសកំណត់</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        {state === 'paid' && latestPayment ? (
                          <button
                            type="button"
                            onClick={() => onViewReceipt(latestPayment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>វិក្កយបត្រ</span>
                          </button>
                        ) : state === 'partial' && partialPayment ? (
                          <button
                            type="button"
                            onClick={() => onTopUpPayment(partialPayment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>បង់បន្ថែម</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRecordPaymentForStudent(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>កត់ត្រាបង់</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
